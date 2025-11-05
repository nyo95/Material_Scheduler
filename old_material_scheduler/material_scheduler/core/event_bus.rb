module MaterialScheduler
  class EventBus
    def initialize; @subs = {}; end
    def subscribe(topic, &blk); (@subs[topic] ||= []) << blk; end
    def publish(topic, payload=nil); (@subs[topic]||[]).each{|b| b.call(payload) rescue nil}; end
  end
end
