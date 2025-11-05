module MSched
  module EventBus
    @subs = Hash.new{|h,k| h[k]=[]}
    def self.subscribe(topic,&b); @subs[topic]<<b; b; end
    def self.publish(topic,payload={}); (@subs[topic]||[]).each{|b| b.call(payload)}; end
  end
end
