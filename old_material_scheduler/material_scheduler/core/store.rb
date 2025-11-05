module MaterialScheduler
  class Store
    def initialize(bus); @bus=bus; @snapshot={rows:[],types:[],hidden_rows:[],meta:{status:'Ready.'}}; end
    def replace(rows:, types:, hidden_rows: [], meta: {})
      @snapshot[:rows]=rows; @snapshot[:types]=types; @snapshot[:hidden_rows]=hidden_rows; @snapshot[:meta]=(@snapshot[:meta]||{}).merge(meta)
      @bus.publish(:rows_updated, @snapshot)
    end
    def set_status(s); @snapshot[:meta]||={}; @snapshot[:meta][:status]=s; @bus.publish(:rows_updated, @snapshot); end
    def snapshot; @snapshot; end
  end
end
