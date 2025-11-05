# frozen_string_literal: true
require 'json'

module MaterialScheduler
  module Shell
    class DialogController
      def self.open
        @bus   ||= MaterialScheduler::EventBus.new
        @store ||= MaterialScheduler::Store.new(@bus)
        @attrs ||= MaterialScheduler::Attributes.new(::Sketchup.active_model)
        @dlg   ||= HtmlView.new(@bus, @store, @attrs)
        @sync  ||= MaterialScheduler::SyncService.new(::Sketchup.active_model, @bus, @store, @attrs)

        @attrs.set_types(MaterialScheduler::Master.load_master)
        @store.replace(rows: [], types: @attrs.get_types, meta: { status: 'Ready.' })

        unless @observers_attached
          ::Sketchup.active_model.materials.add_observer(
            MaterialScheduler::MaterialsWatcher.new(@bus, @store, @attrs)
          )
          @observers_attached = true
        end

        @dlg.show
        @sync.open_and_refresh
      end
    end

    class HtmlView
      def initialize(bus, store, attrs)
        @bus, @store, @attrs = bus, store, attrs

        @d = ::UI::HtmlDialog.new(
          dialog_title: 'Material Scheduler (Beta)',
          preferences_key: 'MaterialScheduler/UI',
          resizable: true, width: 1180, height: 740
        )

        @d.set_file(File.join(__dir__, 'web', 'index.html'))

        @d.add_action_callback('ready')        { |_d,_| push_snapshot }
        @d.add_action_callback('export_csv')   { |_d,_| MaterialScheduler::Exporters::CSVExporter.call(@store.snapshot) }
        @d.add_action_callback('refresh')      { |_d,_| MaterialScheduler::SyncService.new(::Sketchup.active_model, @bus, @store, @attrs).open_and_refresh }
        @d.add_action_callback('apply_change') { |_d,p| handle_change(p) }
        @d.add_action_callback('save_types')   { |_d,p| handle_save_types(p) }

        @bus.subscribe(:rows_updated) { |_snap| push_snapshot }
      end

      def show
        @d.show
      end

      def push_snapshot
        @d.execute_script("window.app && window.app.setData(#{JSON.generate(@store.snapshot)})")
      end

      def push_types
        @d.execute_script("window.app && window.app.setTypes(#{JSON.generate(@attrs.get_types)})")
      end

      def master
        MaterialScheduler::Master.load_master
      end

      def master_prefixes
        master.map { |t| t['prefix'].to_s.upcase }.uniq
      end

      def p2t
        master.each_with_object({}) { |t, h| h[t['prefix'].to_s.upcase] = t['type'] }
      end

      def handle_change(payload)
        data  = JSON.parse(payload)
        model = ::Sketchup.active_model
        mats  = model.materials.to_a
        target = mats.find { |m| m.persistent_id == data['id'] }
        return unless target

        info  = @attrs.mat_info(target) || {}
        field = data['field']

        case field
        when 'type'
          entry = @attrs.get_types.find { |t| t['type'] == data['value'] }
          if entry
            before = target.name.to_s
            after  = MaterialScheduler::RulesEngine.new(model, @attrs).assign_type!(target, entry)
            if before.to_s.upcase != after.to_s.upcase
              @store.set_status("Normalized: #{before} → #{after}")
            else
              @store.set_status("Type set to #{entry['type']}")
            end
          else
            info['type'] = 'Unassigned'
            info['prefix'] = nil
            @attrs.set_mat_info(target, info)
            @store.set_status('Type set to Unassigned')
          end
          MaterialScheduler::SyncService.new(model, @bus, @store, @attrs).open_and_refresh

        when 'code'
          master = MaterialScheduler::Master.load_master
          pxs    = master.map { |t| t['prefix'].to_s.upcase }
          p2tmap = master.each_with_object({}) { |t, h| h[t['prefix'].to_s.upcase] = t['type'] }
          begin
            before = target.name.to_s
            after  = MaterialScheduler::RulesEngine.new(model, @attrs).set_code!(target, data['value'], pxs, p2tmap)
            if before.to_s.upcase != after.to_s.upcase
              @store.set_status("Normalized: #{before} → #{after}")
            else
              @store.set_status("Code set to #{after}")
            end
            MaterialScheduler::SyncService.new(model, @bus, @store, @attrs).open_and_refresh
          rescue => e
            ::UI.messagebox(e.message)
          end

        when 'brand'         then info['brand'] = data['value'].to_s;        @attrs.set_mat_info(target, info)
        when 'subtype'       then info['subtype'] = data['value'].to_s;      @attrs.set_mat_info(target, info)
        when 'notes'         then info['notes'] = data['value'].to_s;        @attrs.set_mat_info(target, info)
        when 'sample_notes'  then info['sample_notes'] = data['value'].to_s; @attrs.set_mat_info(target, info)
        when 'locked'        then info['locked'] = !!data['value'];          @attrs.set_mat_info(target, info)
        when 'sample'        then info['sample'] = !!data['value'];          @attrs.set_mat_info(target, info)
        when 'sample_received' then info['sample_received'] = !!data['value']; @attrs.set_mat_info(target, info)
        when 'hide'          then info['hidden'] = true;                     @attrs.set_mat_info(target, info)
        when 'unhide'        then info['hidden'] = false;                    @attrs.set_mat_info(target, info)
        when 'delete'        then model.materials.remove(target)
        end
      end

      def handle_save_types(payload)
        arr = JSON.parse(payload).map do |h|
          { 'type' => h['type'].to_s.strip, 'prefix' => h['prefix'].to_s.strip.upcase }
        end

        if arr.any? { |h| h['type'].empty? || h['prefix'].empty? }
          ::UI.messagebox('Type/Prefix tidak boleh kosong.')
          return
        end
        pxs = arr.map { |h| h['prefix'] }
        if pxs.uniq.size != pxs.size
          ::UI.messagebox('Prefix duplikat tidak diizinkan.')
          return
        end

        MaterialScheduler::Master.save_master(arr)
        @attrs.set_types(arr)
        push_types
        MaterialScheduler::SyncService.new(::Sketchup.active_model, @bus, @store, @attrs).open_and_refresh
      rescue => e
        ::UI.messagebox("Failed to save types: #{e.message}")
      end
    end
  end
end
