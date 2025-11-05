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

    def self.entries(include_hidden: true)
      kinds = MSched::KindsStore.list
      list = []
      mats.each do |m|
        meta = read_meta(m)
        next if (!include_hidden && meta['hidden'])
        eff  = meta['code']
        begin
          eff ||= MSched::RulesEngine.canonical(m.display_name)
        rescue
        end
        pref = meta['type'] || (eff && eff.split('-')[0])
        list << {
          id:    m.persistent_id,
          name:  m.display_name,
          code:  eff,
          type:  pref,
          brand: meta['brand'],
          notes: meta['notes'],
          sample: !!meta['sample'],
          sample_received: !!meta['sample_received'],
          hidden: !!meta['hidden'],
          locked: !!meta['locked'],
          number: (eff && eff.split('-')[1]&.to_i),
          kind_label: kinds[pref]
        }
      end
      list
    end
  end
end

