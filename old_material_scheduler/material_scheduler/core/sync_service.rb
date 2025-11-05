module MaterialScheduler
  class SyncService
    # Tidak lagi memaksa normalisasi berdasarkan pola nama.
    # CODE_RE disisakan bila dibutuhkan logic lain, tapi tidak dipakai di row_for.
    CODE_RE = /\A([A-Za-z]{2,})-([0-9]+)\z/

    def initialize(model,bus,store,attributes)
      @model=model; @bus=bus; @store=store; @attributes=attributes
    end

    def open_and_refresh
      master = MaterialScheduler::Master.load_master
      @attributes.set_types(master)

      rows_all = @model.materials.map { |m| row_for(m, master) }
      vis = rows_all.reject { |r| r[:hidden] }
      hid = rows_all.select  { |r| r[:hidden] }

      meta = { status: status(vis,hid), updated_at: Time.now }
      @store.replace(rows: vis, types: master, hidden_rows: hid, meta: meta)
    rescue => e
      @store.set_status("Error: #{e.class} - #{e.message}")
    end

    def status(vis,hid)
      "#{vis.size} visible • #{hid.size} hidden • #{(vis+hid).count { |x| x[:sample] }} samples"
    end

    # ——— Inti perubahan di sini ———
    # 1) Jika material BELUM punya metadata plugin (atau type kosong) → paksa Unassigned, prefix=nil,
    #    code diisi dari nama material apa adanya (dinormalisasi ke UPPER + '-' untuk spasi/underscore).
    # 2) Jika material SUDAH punya metadata (type terisi) → hormati metadata itu (tidak menormalisasi nama).
    # 3) Thumbnail dihitung HANYA saat refresh ini dipanggil; tidak ada observer untuk thumbnail.
    def row_for(m, master)
      info = @attributes.mat_info(m) || {}

      if info['type'].to_s.strip.empty?
        # Material dianggap "baru" (belum pernah disentuh plugin) → set Unassigned
        info['type']   = 'Unassigned'
        info['prefix'] = nil
        info['code']   = m.name.to_s.upcase.strip.gsub(/[\s_]+/, '-')
        @attributes.set_mat_info(m, info)
      else
        # Sudah ada metadata dari plugin sebelumnya → tetap dipakai
        # (Tidak memaksa normalisasi nama maupun prefix di sini)
      end

      {
        id: m.persistent_id,
        code: info['code'],
        brand: info['brand'] || '',
        type: info['type'] || 'Unassigned',
        subtype: info['subtype'] || '',
        notes: info['notes'] || '',
        sample_notes: info['sample_notes'] || '',
        locked: !!info['locked'],
        sample: !!info['sample'],
        sample_received: !!info['sample_received'],
        hidden: !!info['hidden'],
        thumb: thumb_for(m)  # dihitung hanya saat refresh dipanggil manual/otomatis oleh event yang relevan
      }
    end

    # Thumbnail hanya tersaji saat refresh dipanggil;
    # tidak ada autosync thumbnail dari observer sehingga tetap ringan.
    def thumb_for(mat)
  # Jika ada tekstur, tulis PNG sementara lalu kembalikan sebagai file:// URL
  if mat.texture
    dir = File.join(MaterialScheduler::Master.plugin_root, 'tmp')
    FileUtils.mkdir_p(dir) unless Dir.exist?(dir)
    path = File.join(dir, "mat_#{mat.persistent_id}.png")
    begin
      mat.texture.write(path)
      # Normalisasi path Windows → URL aman untuk CSS
      norm = path.gsub('\\', '/')
      url  = "file:///#{norm}"
      # cache-buster
      return "#{url}?t=#{Time.now.to_i}"
    rescue
      # jatuh ke fallback warna
    end
  end

  # Fallback warna (selalu aman karena pakai data URL)
  c = mat.color
  r = c ? c.red   : 200
  g = c ? c.green : 200
  b = c ? c.blue  : 200
  svg = "<svg xmlns='http://www.w3.org/2000/svg' width='40' height='28'><rect width='40' height='28' fill='rgb(#{r},#{g},#{b})'/></svg>"
  "data:image/svg+xml;utf8,#{svg}"
rescue
  nil
end

  end
end
