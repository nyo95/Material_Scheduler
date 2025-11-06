require 'json'
module MSched
  module KindsStore
    FILE='types.json'.freeze
    def self.path; File.join(MSched::ROOT, FILE); end
    def self.load
      if File.exist?(path)
        begin
          raw = JSON.parse(File.read(path))
          if raw.is_a?(Hash)
            return raw
          elsif raw.is_a?(Array)
            # Migrate array of {type,prefix} to map prefix=>type
            h = {}
            raw.each{|e| px=e['prefix'].to_s.upcase; next if px.empty?; h[px] = e['type'].to_s }
            return h
          end
        rescue
          # fall through
        end
      end
      MetadataStore.get('kinds',{})||{}
    end
    def self.save(hash)
      backup!
      File.write(path, JSON.pretty_generate(hash||{}))
      MetadataStore.set('kinds', hash||{})
      EventBus.publish(:data_changed, {})
      true
    end
    def self.list; load; end
    def self.backup!
      return unless File.exist?(path)
      ts = Time.now.strftime('%Y%m%d-%H%M%S')
      File.write(path.sub(/\.json$/, "_#{ts}.bak.json"), File.read(path))
    end
  end
end
