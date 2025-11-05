require 'json'
module MSched
  module DialogRPC
    @dlg = nil
    @handlers = {}

    def self.dialog
      return @dlg if @dlg && @dlg.visible?
      @dlg ||= begin
        d = UI::HtmlDialog.new(
          dialog_title: 'Material Scheduler v' + MSched::VERSION,
          preferences_key: 'material_scheduler_ui',
          width: 1120, height: 720, resizable: true, scrollable: true
        )
        d.set_file(File.join(MSched::ROOT, 'ui', 'dialog.html'))

        d.add_action_callback('rpc') do |_ctx, payload|
          begin
            data = JSON.parse(payload.to_s) rescue {}
            name = data['name']
            args = data['args'] || {}
            MSched::Logger.info(:rpc_in, name: name, args: args)
            raise 'Unknown RPC: ' + name.to_s unless @handlers[name]
            res = @handlers[name].call(args)
            d.execute_script('window.__ms_rpc_resolve(' + { name: name, result: res }.to_json + ')')
          rescue => e
            MSched::Logger.error(:rpc_error, message: e.message, backtrace: (e.backtrace || [])[0, 2])
            d.execute_script('window.__ms_rpc_reject(' + { name: name, error: e.message }.to_json + ')')
          end
        end

        d.add_action_callback('ready') { |_ctx, _| MSched::Logger.info(:ui_ready); MSched::DialogRPC.push_full }
        d.add_action_callback('refresh') { |_ctx, _| MSched::Logger.info(:compat_refresh); MSched::DialogRPC.push_full }
        d.add_action_callback('export_csv') do |_ctx, _|
          begin
            rows = MSched::MetadataStore.entries
            cols = %w[code brand type notes locked sample hidden name kind_label]
            path = UI.savepanel('Export CSV', Dir.pwd, 'materials.csv')
            if path
              require 'csv'
              File.write(path, MSched::CSVExporter.export(rows, cols))
              UI.messagebox('Exported.')
            end
          rescue => e
            MSched::Logger.error(:export_fail, message: e.message)
          end
        end
        d.add_action_callback('apply_change') { |_ctx, payload| MSched::DialogRPC.__compat_apply_change(payload) }
        d.add_action_callback('save_types') { |_ctx, payload| MSched::DialogRPC.__compat_save_types(payload) }
        d.add_action_callback('ping') { |_ctx, arg| MSched::Logger.info(:ui_ping, arg: arg); begin; @dlg && @dlg.execute_script("window.__setStatus && __setStatus('Bridge OK')"); rescue; end }

        UI.start_timer(0.1, false) { push_full }
        d
      end
    end

    def self.show
      dialog.show
    end

    def self.close
      begin
        @dlg.close if @dlg
      rescue
      ensure
        @dlg = nil
      end
    end

    def self.on(name, &blk)
      @handlers[name] = blk
    end

    def self.push_full
      data = {
        entries: MSched::MetadataStore.entries(include_hidden: true, used_only: true),
        kinds: MSched::KindsStore.list,
        logs: MSched::Logger.tail(10),
        selected: @last_selected || nil
      }
      @dlg && @dlg.execute_script('window.__ms_receive_full(' + data.to_json + ')')
    end

    def self.update_selected(payload)
      @last_selected = payload
      @dlg && @dlg.execute_script('window.__ms_selected_info(' + payload.to_json + ')')
    end
  end
end

MSched::EventBus.subscribe(:data_changed) { |_p| MSched::DialogRPC.push_full }
MSched::EventBus.subscribe(:selected_material_info) { |p| MSched::DialogRPC.update_selected(p) if p }

module MSched
  DialogRPC.on('get_full') { |_a| { entries: MetadataStore.entries(include_hidden: true, used_only: true), kinds: KindsStore.list } }

  DialogRPC.on('quick_apply') do |a|
    id = a['id'].to_i
    prefix = (a['prefix'] || '').to_s.upcase.strip
    number = (a['number'] || '').to_s.strip
    brand = (a['brand'] || '').to_s.strip.gsub(/\s+/, ' ')
    notes = (a['notes'] || '').to_s.strip.gsub(/\s+/, ' ')
    subtype = (a['subtype'] || '').to_s.strip.gsub(/\s+/, ' ')
    upd = nil
    Undo.wrap('Quick Apply') do
      m = MetadataStore.find_material(id); raise 'NOT_FOUND' unless m
      meta = MetadataStore.read_meta(m)
      raise 'LOCKED_EDIT_DENIED' if meta['locked']

      if prefix && prefix != ''
        MetadataStore.write_meta(m, { 'type' => prefix })
      end
      eff_pref = (prefix && prefix != '') ? prefix : (meta['type'] || nil)
      if eff_pref && eff_pref != ''
        desired = number.to_i > 0 ? number.to_i : (RulesEngine.number_of(meta['code']) || 1)
        CodeAllocator.allocate_from_number(m, eff_pref, desired)
      end
      MetadataStore.write_meta(m, { 'brand' => brand, 'notes' => notes, 'subtype' => subtype })
      # Build updated snapshot to return
      latest = MetadataStore.read_meta(m)
      sw = nil; begin; sw = MSched::SyncService.swatch_for(m); rescue; end
      upd = {
        id: m.persistent_id,
        name: m.display_name,
        code: latest['code'],
        type: latest['type'],
        number: (latest['code'] && latest['code'].split('-')[1]&.to_i),
        brand: latest['brand'],
        notes: latest['notes'],
        subtype: latest['subtype'],
        sample: !!latest['sample'],
        hidden: !!latest['hidden'],
        locked: !!latest['locked'],
        swatch: sw
      }
    end
    EventBus.publish(:data_changed, {}); { ok: true, updated: upd }
  end

  DialogRPC.on('normalize_all') { |_a| CodeAllocator.normalize_all }

  DialogRPC.on('set_flags') do |a|
    ids = Array(a['ids']).map(&:to_i)
    flags = a['flags'] || {}
    # Normalize alias keys from UI
    if flags.key?('received') && !flags.key?('sample_received')
      flags['sample_received'] = flags.delete('received')
    end
    changed = []
    Undo.wrap('Set Flags') do
      ids.each do |pid|
        m = MetadataStore.find_material(pid); next unless m
        meta = MetadataStore.read_meta(m)
        # When locked: allow toggling 'sample' only; block others
        if meta['locked'] && (flags.keys - ['locked','sample']).any?
          next
        end
        MetadataStore.write_meta(m, meta.merge(flags)); changed << pid
      end
    end
    EventBus.publish(:data_changed, {}); { ok: true, ids: changed }
  end

  DialogRPC.on('swap_codes') do |a|
    ida = a['a'].to_i; idb = a['b'].to_i
    m1 = MetadataStore.find_material(ida); m2 = MetadataStore.find_material(idb)
    raise 'NOT_FOUND' unless m1 && m2
    meta1 = MetadataStore.read_meta(m1); meta2 = MetadataStore.read_meta(m2)
    # Disallow when locked / hidden
    raise 'LOCKED_SWAP_DENIED' if meta1['locked'] || meta2['locked']
    raise 'HIDDEN_SWAP_DENIED' if meta1['hidden'] || meta2['hidden']
    c1 = meta1['code'] || (RulesEngine.canonical(m1.display_name) rescue nil)
    c2 = meta2['code'] || (RulesEngine.canonical(m2.display_name) rescue nil)
    raise 'MISSING_CODE' unless c1 && c2
    t1 = c1.split('-',2)[0]; t2 = c2.split('-',2)[0]
    # Enforce same prefix/type
    raise 'TYPE_MISMATCH' unless t1 == t2
    # Full swap: exchange codes (rename) safely using a temporary name to avoid collisions.
    Undo.wrap('Swap Codes') do
      tmp = "__swap_#{Time.now.to_i}_#{rand(100000)}"
      # Move m1 away
      m1.name = tmp
      MetadataStore.write_meta(m1, meta1.merge({ 'code'=>nil }))
      # Assign code1 to m2
      m2.name = c1
      MetadataStore.write_meta(m2, meta2.merge({ 'code'=>c1, 'type'=>t1 }))
      # Assign code2 to m1
      m1.name = c2
      MetadataStore.write_meta(m1, meta1.merge({ 'code'=>c2, 'type'=>t2 }))
    end
    EventBus.publish(:data_changed, {}); { ok: true }
  end

  DialogRPC.on('delete_material') do |a|
    id = a['id'].to_i
    Undo.wrap('Delete Material') do
      m = MetadataStore.find_material(id); raise 'NOT_FOUND' unless m
      meta = MetadataStore.read_meta(m); raise 'LOCKED_EDIT_DENIED' if meta['locked']
      MetadataStore.delete_meta(m); Sketchup.active_model.materials.remove(m)
    end
    EventBus.publish(:data_changed, {}); { ok: true }
  end

  DialogRPC.on('kinds_save') { |a| KindsStore.save(a['kinds'] || {}); { ok: true } }
  DialogRPC.on('export_csv') { |a| cols = a['cols'] || []; rows = MetadataStore.entries; csv = CSVExporter.export(rows, cols); { csv: csv } }
  DialogRPC.on('normalize_preview') { |_a| MSched::CodeAllocator.normalize_preview }

  DialogRPC.on('purge_unused_materials') do |_a|
    used = MetadataStore.used_material_ids
    removed = []
    MSched::Undo.wrap('Purge Unused Materials') do
      Sketchup.active_model.materials.each do |m|
        next if used.include?(m.persistent_id)
        Sketchup.active_model.materials.remove(m)
        removed << m.display_name rescue nil
      end
    end
    EventBus.publish(:data_changed, {})
    { ok: true, removed_count: removed.size }
  end

  def self.__compat_apply_change(payload)
    data  = JSON.parse(payload.to_s) rescue {}
    id    = (data['id'] || data[:id]).to_i
    field =  data['field'] || data[:field]
    val   = data['value']
    m = MSched::MetadataStore.find_material(id); return { ok: false } unless m
    meta = MSched::MetadataStore.read_meta(m) || {}
    case field
    when 'type'
      kinds = MSched::KindsStore.list
      px = kinds.key(val) || val.to_s.upcase
      MSched::Undo.wrap('Set Type') { MSched::MetadataStore.write_meta(m, meta.merge({ 'type' => px })) }
      if !meta['code'] && px && !px.empty?
        MSched::CodeAllocator.allocate_from_number(m, px, 1)
      end
      MSched::EventBus.publish(:data_changed, {})
      { ok: true }
    when 'code'
      norm = (MSched::RulesEngine.canonical(val) rescue nil)
      if norm
        px = norm.split('-', 2)[0]
        num = norm.split('-', 2)[1].to_i
        MSched::Undo.wrap('Set Code') { MSched::CodeAllocator.allocate_from_number(m, px, num) }
        MSched::EventBus.publish(:data_changed, {})
        { ok: true }
      else
        { ok: false }
      end
    when 'brand','subtype','notes','sample_notes','locked','sample','sample_received','hidden'
      if field == 'brand' || field == 'notes'
        val = (val || '').to_s.strip.gsub(/\s+/, ' ')
      end
      MSched::Undo.wrap('Set Meta') { MSched::MetadataStore.write_meta(m, meta.merge({ field => val })) }
      MSched::EventBus.publish(:data_changed, {}); { ok: true }
    when 'hide'
      MSched::Undo.wrap('Hide') { MSched::MetadataStore.write_meta(m, meta.merge({ 'hidden' => true })) }
      MSched::EventBus.publish(:data_changed, {}); { ok: true }
    when 'unhide'
      MSched::Undo.wrap('Unhide') { MSched::MetadataStore.write_meta(m, meta.merge({ 'hidden' => false })) }
      MSched::EventBus.publish(:data_changed, {}); { ok: true }
    when 'delete'
      MSched::Undo.wrap('Delete') { MSched::MetadataStore.delete_meta(m); Sketchup.active_model.materials.remove(m) }
      MSched::EventBus.publish(:data_changed, {}); { ok: true }
    else
      { ok: false }
    end
  end

  def self.__compat_save_types(payload)
    arr = JSON.parse(payload.to_s) rescue []
    kinds = {}
    if arr.is_a?(Array)
      arr.each do |h|
        px = (h['prefix'] || h[:prefix]).to_s.upcase.strip
        lb = (h['type'] || h[:type] || '').to_s
        next if px.empty?
        kinds[px] = lb
      end
    end
    MSched::KindsStore.save(kinds)
    MSched::DialogRPC.push_full
    { ok: true }
  end
end
