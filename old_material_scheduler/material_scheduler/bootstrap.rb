# frozen_string_literal: true
module MaterialScheduler
  require 'json'
  require 'fileutils'
  require_relative 'core/event_bus'
  require_relative 'core/store'
  require_relative 'core/attributes'
  require_relative 'core/master'
  require_relative 'core/observers'
  require_relative 'core/sync_service'
  require_relative 'core/rules_engine'
  require_relative 'exporters/csv_exporter'
  require_relative 'shell/dialog'

  unless file_loaded?(__FILE__)
    ::UI.menu('Extensions').add_item('Material Scheduler (Beta)') { MaterialScheduler::Shell::DialogController.open }
    tb = ::UI::Toolbar.new('Material Scheduler')
    cmd_open = ::UI::Command.new('Open Scheduler') { MaterialScheduler::Shell::DialogController.open }
    tb.add_item(cmd_open); tb.show
    file_loaded(__FILE__)
  end
end
