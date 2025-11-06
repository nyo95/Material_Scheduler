module MSched
  module Undo
    def self.wrap(name='Material Scheduler')
      m=Sketchup.active_model
      m.start_operation(name, true)
      begin
        yield
      ensure
        m.commit_operation
      end
    end
  end
end
