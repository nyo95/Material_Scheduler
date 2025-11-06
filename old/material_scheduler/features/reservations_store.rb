require 'json'
module MSched
  module ReservationsStore
    KEY='reservations'.freeze
    def self.get; MetadataStore.get(KEY,{})||{}; end
    def self.set(map); Undo.wrap('Save Reservations'){ MetadataStore.set(KEY, map||{}) }; EventBus.publish(:data_changed, {}); true; end
    def self.import_json(json_str); map=JSON.parse(json_str.to_s) rescue {}; raise 'INVALID_FORMAT' unless map.is_a?(Hash); set(map); { ok:true, count: map.keys.size }; end
    def self.export_json; JSON.pretty_generate(get); end
  end
end
