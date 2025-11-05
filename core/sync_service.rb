module MSched
  module SyncService
    @timer=nil; @selection_obs=nil; @materials_obs=nil; @debounce_sec=0.25

    def self.start
      attach_selection_listener
    end

    def self.debounce(&blk)
      UI.stop_timer(@timer) if @timer
      @timer = UI.start_timer(@debounce_sec, false){ blk.call }
    end

    def self.attach_selection_listener
      return if @selection_obs
      # Selection observer (entities picked in model)
      @selection_obs = Class.new do
        define_method(:onSelectionBulkChange){ |sel| MSched::SyncService.selection_changed(sel) }
        define_method(:onSelectionCleared){ |sel| MSched::SyncService.selection_changed(sel) }
        define_method(:onSelectionAdded){ |sel,_| MSched::SyncService.selection_changed(sel) }
        define_method(:onSelectionRemoved){ |sel,_| MSched::SyncService.selection_changed(sel) }
      end.new
      Sketchup.active_model.selection.add_observer(@selection_obs)

      # Materials palette observer (color picker current material)
      return if @materials_obs
      @materials_obs = Class.new(Sketchup::MaterialsObserver) do
        define_method(:onMaterialSetCurrent){ |materials, material| MSched::SyncService.material_selected(material) }
      end.new
      Sketchup.active_model.materials.add_observer(@materials_obs)
    end

    def self.material_selected(mat)
      return unless mat
      meta = MetadataStore.read_meta(mat)
      payload = {
        id: mat.persistent_id,
        name: mat.display_name,
        code: meta['code'],
        type: meta['type'],
        number: (meta['code'] && meta['code'].split('-')[1]&.to_i),
        brand: meta['brand'],
        notes: meta['notes'],
        sample: !!meta['sample'],
        hidden: !!meta['hidden'],
        locked: !!meta['locked']
      }
      MSched::EventBus.publish(:selected_material_info, payload)
    end

    def self.selection_changed(sel)
      debounce do
        mat = nil
        sel.each do |ent|
          if ent.respond_to?(:material) && ent.material
            mat = ent.material
            break
          end
        end
        if mat
          meta = MetadataStore.read_meta(mat)
          payload = {
            id: mat.persistent_id,
            name: mat.display_name,
            code: meta['code'],
            type: meta['type'],
            number: (meta['code'] && meta['code'].split('-')[1]&.to_i),
            brand: meta['brand'],
            notes: meta['notes'],
            sample: !!meta['sample'],
            hidden: !!meta['hidden'],
            locked: !!meta['locked']
          }
          MSched::EventBus.publish(:selected_material_info, payload)
        else
          MSched::EventBus.publish(:selected_material_info, nil)
        end
      end
    end
  end
end
