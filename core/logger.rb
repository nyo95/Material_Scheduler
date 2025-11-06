require 'time'
require 'json'
require 'fileutils'

module MSched
  module Logger
    @buf = []
    MAX = 300

    @file_enabled = true
    @file_error_once = false
    @file_path = begin
      File.join(MSched::ROOT, 'msched.log')
    rescue
      'msched.log'
    end

    def self.configure(file: nil, enabled: nil)
      @file_path = file if file && file.to_s.strip != ''
      @file_enabled = !!enabled unless enabled.nil?
    end

    def self.log(level, event, data = {})
      rec = { ts: Time.now.utc.iso8601, level: level, event: event, data: data }
      @buf << rec
      @buf.shift while @buf.length > MAX
      puts "[MS] #{rec.inspect}"
      write_file(rec) if @file_enabled
      rec
    end

    def self.write_file(rec)
      path = @file_path
      dir = File.dirname(path)
      begin
        FileUtils.mkdir_p(dir) unless Dir.exist?(dir)
        rotate_if_needed(path)
        File.open(path, 'a') { |f| f.puts(rec.to_json) }
      rescue => e
        unless @file_error_once
          # Avoid spamming console on repeated failures
          @file_error_once = true
          puts "[MS] #{ { level: :warn, event: :log_file_error, data: { message: e.message, path: path } }.inspect }"
        end
      end
    end

    def self.rotate_if_needed(path)
      max_bytes = 512 * 1024 # ~0.5 MB simple rotation
      return unless File.exist?(path) && File.size(path) > max_bytes
      backup = path + '.1'
      begin
        File.delete(backup) if File.exist?(backup)
      rescue
      end
      begin
        File.rename(path, backup)
      rescue
        # If rename fails, fallback to truncation
        File.open(path, 'w') { |f| f.truncate(0) }
      end
    end

    class << self
      def tail(n = 50)
        @buf.last(n)
      end
      def info(e, d = {})
        log(:info, e, d)
      end
      def warn(e, d = {})
        log(:warn, e, d)
      end
      def error(e, d = {})
        log(:error, e, d)
      end
    end
  end
end

