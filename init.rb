module MSched
  ROOT = File.dirname(__FILE__) unless defined?(MSched::ROOT)
end
require_relative 'core/logger'
require_relative 'core/undo'
require_relative 'core/event_bus'
require_relative 'core/metadata_store'
require_relative 'features/kinds_store'
require_relative 'features/rules_engine'
require_relative 'features/code_allocator'
require_relative 'features/csv_exporter'
require_relative 'core/sync_service'
require_relative 'core/dialog_rpc'

MSched::SyncService.start

unless file_loaded?(__FILE__)
  UI.menu('Extensions').add_item('Material Scheduler') { MSched::DialogRPC.show }
  file_loaded(__FILE__)
end

