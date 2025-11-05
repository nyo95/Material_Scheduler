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
  UI.menu('Extensions').add_item('Material Scheduler — Reload') { MSched.reload! }
  file_loaded(__FILE__)
end

# Dev-friendly reload + toolbar
module MSched
  def self.reload!
    begin
      MSched::DialogRPC.close rescue nil
      MSched::SyncService.stop rescue nil
      # Reload all Ruby files under this extension, except this init file
      Dir.glob(File.join(MSched::ROOT, '**', '*.rb')).sort.each do |rb|
        next if rb.end_with?(File.join('material_scheduler','init.rb'))
        load rb
      end
      MSched::SyncService.start rescue nil
      UI.messagebox('Material Scheduler reloaded.')
    rescue => e
      UI.messagebox("Reload failed: #{e.message}")
    end
  end

  def self.ensure_toolbar
    return @toolbar if @toolbar
    tb = UI::Toolbar.new('Material Scheduler')
    cmd_open = UI::Command.new('Open') { MSched::DialogRPC.show }
    cmd_open.tooltip = 'Open Material Scheduler'
    cmd_reload = UI::Command.new('Reload') { MSched.reload! }
    cmd_reload.tooltip = 'Reload extension code (dev)'
    tb.add_item(cmd_open)
    tb.add_separator
    tb.add_item(cmd_reload)
    tb.show
    @toolbar = tb
  end
end

MSched.ensure_toolbar

