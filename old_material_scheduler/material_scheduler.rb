module MaterialScheduler
  PLUGIN_NAME = 'Material Scheduler (Beta)'
  PLUGIN_VER  = '0.3.3'
  EXT = SketchupExtension.new(PLUGIN_NAME, 'material_scheduler/bootstrap')
  EXT.version = PLUGIN_VER
  EXT.creator = 'Material Scheduler'
  EXT.description = 'Live material scheduler / manager with coding, kinds master, samples & hidden.'
  Sketchup.register_extension(EXT, true)
end
