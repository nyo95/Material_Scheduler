module MSched
  module CodeAllocator
    def self.canonical(code); RulesEngine.canonical(code); end
    def self.number_of(code); RulesEngine.number_of(code); end

    def self.used_numbers(prefix, exclude_pid: nil)
      nums = []
      Sketchup.active_model.materials.each do |m|
        next if exclude_pid && m.persistent_id == exclude_pid
        meta = MetadataStore.read_meta(m)
        eff  = meta['code']
        next unless eff && eff.start_with?("#{prefix}-")
        n = RulesEngine.number_of(eff)
        nums << n if n and n>0
      end
      nums.uniq
    end

    def self.reserved_numbers(prefix)
      map = MetadataStore.get('reservations',{})||{}
      arr = (map[prefix]||[]).map{|c| RulesEngine.number_of(c)}.compact
      arr.uniq
    end

    def self.next_free_from(prefix, start_num, exclude_pid: nil)
      used = used_numbers(prefix, exclude_pid: exclude_pid)
      resv = reserved_numbers(prefix)
      n = [start_num.to_i, 1].max
      loop do
        return n unless used.include?(n) or resv.include?(n)
        n += 1
      end
    end

    def self.set_code_for(mat, prefix, number)
      code = RulesEngine.make_code(prefix, number)
      MetadataStore.write_meta(mat, { 'type'=>prefix, 'code'=>code })
      mat.name = code
      code
    end

    def self.allocate_from_number(mat, prefix, number)
      n = next_free_from(prefix, number, exclude_pid: mat.persistent_id)
      set_code_for(mat, prefix, n)
    end

    def self.normalize_all
      changed = []
      Undo.wrap('Normalize Materials') do
        groups = Hash.new{|h,k| h[k]=[]}
        Sketchup.active_model.materials.each{|m| groups[MetadataStore.read_meta(m)['type']] << m }
        groups.each do |prefix, mats|
          next unless prefix && prefix != ''
          mats.sort_by!{|m| m.persistent_id }
          mats.each do |m|
            meta = MetadataStore.read_meta(m)
            next if meta['hidden'] || meta['locked']
            desired = RulesEngine.number_of(meta['code']) || 1
            n = next_free_from(prefix, desired, exclude_pid: m.persistent_id)
            code = RulesEngine.make_code(prefix, n)
            if m.name != code || meta['code'] != code
              MetadataStore.write_meta(m, { 'code'=>code })
              m.name = code
              changed << { id: m.persistent_id, code: code }
            end
          end
        end
      end
      EventBus.publish(:data_changed, {})
      MSched::Logger.info(:normalize_done, changed: changed.size)
      { changed: changed }
    end
  end
end
