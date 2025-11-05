module MSched
  module RulesEngine
    def self.canonical(code)
      return nil unless code.is_a?(String) && code.include?('-')
      pref,num=code.split('-',2)
      return nil unless pref =~ /^[A-Z]{2,}$/ && num =~ /^\d+$/
      '%s-%d' % [pref, num.to_i]
    end
    def self.make_code(prefix, number)
      return nil unless prefix =~ /^[A-Z]{2,}$/ && number.to_i>0
      '%s-%d' % [prefix, number.to_i]
    end
    def self.number_of(code)
      c = canonical(code); return nil unless c
      c.split('-',2)[1].to_i
    end
  end
end
