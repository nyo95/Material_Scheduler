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

# Toolbar (Open only)
module MSched
  def self.ensure_toolbar
    return @toolbar if @toolbar
    tb = UI::Toolbar.new('Material Scheduler')
    cmd_open = UI::Command.new('Open') { MSched::DialogRPC.show }
    cmd_open.tooltip = 'Open Material Scheduler'
    tb.add_item(cmd_open)
    tb.show
    @toolbar = tb
  end
end

MSched.ensure_toolbar

