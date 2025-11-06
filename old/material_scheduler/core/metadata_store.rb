module MSched
  module MetadataStore
    NS = 'material_scheduler'.freeze
    def self.model; Sketchup.active_model; end
    def self.mats; model.materials; end

    def self.read_meta(mat)
      return {} unless mat && mat.valid?
      key = 'mat_%d' % mat.persistent_id
      h = model.get_attribute(NS, key, {}) || {}
      # Also read from material attribute dictionary 'ms' for robustness
      begin
        d = mat.attribute_dictionary('ms', false)
        if d
          d.each_pair do |k,v|
            h[k.to_s] = v
          end
        end
      rescue
      end
      h
    end
    def self.write_meta(mat, patch)
      return unless mat && mat.valid? && patch.is_a?(Hash)
      key = 'mat_%d' % mat.persistent_id
      cur = model.get_attribute(NS, key, {}) || {}
      model.set_attribute(NS, key, cur.merge(patch)); begin; d=mat.attribute_dictionary('ms', true); (cur.merge(patch)).each{|k,v| d[k]=v }; rescue; end
    end
    def self.delete_meta(mat)
      return unless mat && mat.valid?
      key = 'mat_%d' % mat.persistent_id
      model.set_attribute(NS, key, nil)
    end

    def self.get(key, default = {})
      val = model.get_attribute(NS, key, default)
      val.nil? ? default : val
    end
    def self.set(key, value); model.set_attribute(NS, key, value); end

    def self.find_material(pid)
      mats.each{|m| return m if m.persistent_id==pid}; nil
    end

    def self.used_material_ids
      require 'set'
      used = Set.new
      seen_defs = Set.new
      # scan entities recursively
      scan = lambda do |entities|
        entities.each do |e|
          if e.is_a?(Sketchup::Face)
            m = e.material; used << m.persistent_id if m && m.valid?
            mb = e.back_material; used << mb.persistent_id if mb && mb.valid?
          elsif e.is_a?(Sketchup::Group)
            m = e.material; used << m.persistent_id if m && m.valid?
            scan.call(e.entities)
          elsif e.is_a?(Sketchup::ComponentInstance)
            m = e.material; used << m.persistent_id if m && m.valid?
            d = e.definition
            next unless d
            next if seen_defs.include?(d)
            seen_defs << d
            scan.call(d.entities)
          end
        end
      end
      begin
        scan.call(model.entities)
      rescue
      end
      used
    end

    def self.entries(include_hidden: true, used_only: true)
      kinds = MSched::KindsStore.list
      used = used_only ? used_material_ids : nil
      list = []
      mats.each do |m|
        if used_only
          next unless used.include?(m.persistent_id)
        end
        meta = read_meta(m)
        next if (!include_hidden && meta['hidden'])
        eff  = meta['code']
        begin
          eff ||= MSched::RulesEngine.canonical(m.display_name)
        rescue
        end
        pref = meta['type'] || (eff && eff.split('-')[0])
        sw = nil; begin; sw = MSched::SyncService.swatch_for(m); rescue; end
        list << {
          id:    m.persistent_id,
          name:  m.display_name,
          code:  eff,
          type:  pref,
          brand: meta['brand'],
          subtype: meta['subtype'],
          notes: meta['notes'],
          sample_notes: meta['sample_notes'],
          sample: !!meta['sample'],
          sample_received: !!meta['sample_received'],
          hidden: !!meta['hidden'],
          locked: !!meta['locked'],
          number: (eff && eff.split('-')[1]&.to_i),
          kind_label: kinds[pref],
          swatch: sw
        }
      end
      list
    end
  end
end

