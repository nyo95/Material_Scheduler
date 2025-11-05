module MaterialScheduler
  class Master
    def self.plugin_root; File.expand_path(File.join(__dir__,'..')); end
    def self.default_types
      path = File.join(plugin_root,'types.json')
      File.exist?(path) ? JSON.parse(File.read(path)) : [{'type'=>'Paint','prefix'=>'PT'}]
    end
    def self.load_master; default_types rescue default_types; end
    def self.save_master(arr)
      path = File.join(plugin_root,'types.json')
      File.write(path, JSON.pretty_generate(arr)); true rescue false
    end
  end
end
