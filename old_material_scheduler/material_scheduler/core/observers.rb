module MaterialScheduler
  class NameSync
    def initialize; @map={}; @last=Time.at(0); end
    def changed?(materials, material)
      return false unless material
      now=Time.now; return false if now-@last<0.4
      pid=material.persistent_id; name=material.name.to_s; prev=@map[pid]; @map[pid]=name; @last=now
      prev && prev!=name
    end
  end
  class MaterialsWatcher < Sketchup::MaterialsObserver
    def initialize(bus,store,attrs); @bus=bus; @store=store; @attrs=attrs; @ns=NameSync.new; end
    def onMaterialChange(materials,material); return unless @ns.changed?(materials,material); MaterialScheduler::SyncService.new(Sketchup.active_model,@bus,@store,@attrs).open_and_refresh; end
  end
end
