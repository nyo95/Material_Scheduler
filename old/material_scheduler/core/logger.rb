require 'time'
module MSched
  module Logger
    @buf=[]; MAX=300
    def self.log(level, event, data={})
      rec={ ts: Time.now.utc.iso8601, level: level, event: event, data: data }
      @buf << rec; @buf.shift while @buf.length>MAX
      puts "[MS] #{rec.inspect}"
      rec
    end
    class << self
      def tail(n=50); @buf.last(n); end
      def info(e,d={}); log(:info,e,d); end
      def warn(e,d={}); log(:warn,e,d); end
      def error(e,d={}); log(:error,e,d); end
    end
  end
end
