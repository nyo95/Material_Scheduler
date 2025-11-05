# frozen_string_literal: true
module MaterialScheduler
  class RulesEngine
    # Kode kanonik: PREFIX-N (tanpa leading zero)
    CODE_RE = /\A([A-Z]{2,})-([0-9]+)\z/

    def initialize(model, attrs)
      @model = model
      @attrs = attrs
    end

    # Normalisasi string kode ke format kanonik (tanpa ubah prefix lain)
    def normalize_code(raw)
      up = raw.to_s.upcase.strip.gsub(/[\s_]+/, '-')
      m = up.match(CODE_RE)
      return up unless m
      prefix = m[1]
      num    = m[2].to_i
      "#{prefix}-#{num}"
    end

    def used_name?(code, self_material = nil)
      up = code.to_s.upcase
      @model.materials.any? { |m| m != self_material && m.name.to_s.upcase == up }
    end

    def next_free_code(prefix, self_material = nil, start_at = 1)
      n = [start_at.to_i, 1].max
      loop do
        c = "#{prefix}-#{n}"
        return c unless used_name?(c, self_material)
        n += 1
      end
    end

    # Assign Type (auto-slip; set info attr)
    def assign_type!(material, type_entry)
      px   = type_entry['prefix'].to_s.upcase
      tval = type_entry['type'].to_s

      current = material.name.to_s
      base = if current.upcase.start_with?("#{px}-")
               b = normalize_code(current)
               b.start_with?("#{px}-") ? b : "#{px}-1"
             else
               "#{px}-1"
             end

      start_num = base.split('-')[1].to_i
      new_code  = next_free_code(px, material, start_num)

      @model.start_operation('Assign Material Type', true)
      begin
        material.name = new_code
        info = @attrs.mat_info(material) || {}
        info['type']   = tval
        info['prefix'] = px
        info['code']   = new_code
        @attrs.set_mat_info(material, info)
      ensure
        @model.commit_operation
      end
      new_code
    end

    # Set Code manual (validasi prefix lawan master; blokir bentrok)
    def set_code!(material, newc, master_prefixes, p2t)
      norm = normalize_code(newc)
      m = norm.match(CODE_RE)
      raise ArgumentError, 'Invalid code format. Use PREFIX-N (e.g., PT-3).' unless m
      px = m[1]
      raise ArgumentError, 'Invalid prefix — follow master standard.' unless master_prefixes.include?(px)

      if material.name.to_s.upcase == norm
        info = @attrs.mat_info(material) || {}
        info['code']   = norm
        info['prefix'] = px
        info['type']   = p2t[px] || info['type'] || 'Unassigned'
        @attrs.set_mat_info(material, info)
        return norm
      end

      raise ArgumentError, 'Code already in use.' if used_name?(norm, material)

      @model.start_operation('Set Material Code', true)
      begin
        material.name = norm
        info = @attrs.mat_info(material) || {}
        info['code']   = norm
        info['prefix'] = px
        info['type']   = p2t[px] || info['type'] || 'Unassigned'
        @attrs.set_mat_info(material, info)
      ensure
        @model.commit_operation
      end
      norm
    end
  end
end
