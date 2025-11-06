module MSched
  module CodeAllocator
    def self.canonical(code); RulesEngine.canonical(code); end
    def self.number_of(code); RulesEngine.number_of(code); end

    def self.used_numbers(prefix, exclude_pid: nil)
      nums = []
      used_ids = MetadataStore.used_material_ids
      Sketchup.active_model.materials.each do |m|
        next unless used_ids.include?(m.persistent_id)
        next if exclude_pid && m.persistent_id == exclude_pid
        meta = MetadataStore.read_meta(m)
        eff  = meta['code']
        next unless eff && eff.start_with?("#{prefix}-")
        n = RulesEngine.number_of(eff)
        nums << n if n and n>0
      end
      # Also consider used materials whose name already matches the code pattern
      Sketchup.active_model.materials.each do |m|
        next unless used_ids.include?(m.persistent_id)
        next if exclude_pid && m.persistent_id == exclude_pid
        name = (m.name || m.display_name).to_s
        if name.start_with?("#{prefix}-")
          n = RulesEngine.number_of(name)
          nums << n if n && n > 0
        end
      end
      nums.uniq
    end

    def self.reserved_numbers(prefix)
      [] # Reservations feature disabled on main branch
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
      # Guard against name conflicts by bumping number until rename succeeds
      n = number.to_i
      loop do
        begin
          mat.name = RulesEngine.make_code(prefix, n)
          MetadataStore.write_meta(mat, { 'type'=>prefix, 'code'=>RulesEngine.make_code(prefix, n) })
          return RulesEngine.make_code(prefix, n)
        rescue => _e
          n += 1
        end
      end
    end

    def self.allocate_from_number(mat, prefix, number)
      n = next_free_from(prefix, number, exclude_pid: mat.persistent_id)
      set_code_for(mat, prefix, n)
    end

    def self.normalize_all
      changed = []
      Undo.wrap('Normalize Materials') do
        used_ids = MetadataStore.used_material_ids
        groups = Hash.new { |h,k| h[k] = [] }
        # Group USED materials by prefix
        Sketchup.active_model.materials.each do |m|
          next unless used_ids.include?(m.persistent_id)
          meta = MetadataStore.read_meta(m)
          pref = meta['type'] || (canonical(meta['code'] || m.display_name)&.split('-',2)&.first)
          groups[pref] << m if pref && pref != ''
        end
        groups.each do |prefix, mats|
          mats.sort_by! { |m| m.persistent_id }
          # numbers already occupied by locked/hidden used materials
          occupied = []
          mats.each do |m|
            meta = MetadataStore.read_meta(m)
            if meta['locked'] || meta['hidden']
              n = number_of(meta['code'] || m.display_name)
              occupied << n if n && n > 0
            end
          end
          # assign smallest available to the rest
          mats.each do |m|
            meta = MetadataStore.read_meta(m)
            next if meta['locked'] || meta['hidden']
            n = 1
            n += 1 while occupied.include?(n)
            code = RulesEngine.make_code(prefix, n)
            unless (meta['code'] == code) && (m.name == code)
              old = (meta['code'] || m.name)
              MetadataStore.write_meta(m, { 'code' => code, 'type' => prefix })
              m.name = code
              changed << { id: m.persistent_id, from: old, to: code }
            end
            occupied << n
          end
        end
      end
      EventBus.publish(:data_changed, {})
      MSched::Logger.info(:normalize_done, changed: changed.size)
      { changed: changed }
    end

    def self.normalize_preview
      used_ids = MetadataStore.used_material_ids
      plan = []
      groups = Hash.new { |h,k| h[k] = [] }
      Sketchup.active_model.materials.each do |m|
        next unless used_ids.include?(m.persistent_id)
        meta = MetadataStore.read_meta(m)
        pref = meta['type'] || (canonical(meta['code'] || m.display_name)&.split('-',2)&.first)
        groups[pref] << m if pref && pref != ''
      end
      groups.each do |prefix, mats|
        mats.sort_by! { |m| m.persistent_id }
        occupied = []
        mats.each do |m|
          meta = MetadataStore.read_meta(m)
          if meta['locked'] || meta['hidden']
            n = number_of(meta['code'] || m.display_name)
            occupied << n if n && n > 0
          end
        end
        mats.each do |m|
          meta = MetadataStore.read_meta(m)
          next if meta['locked'] || meta['hidden']
          n = 1
          n += 1 while occupied.include?(n)
          code = RulesEngine.make_code(prefix, n)
          cur = meta['code'] || m.display_name
          if cur != code
            plan << { id: m.persistent_id, from: cur, to: code }
          end
          occupied << n
        end
      end
      { changes: plan }
    end
  end
end
