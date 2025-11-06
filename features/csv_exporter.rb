require 'csv'
module MSched
  module CSVExporter
    def self.export(rows, cols)
      # Allowed columns mirroring Scheduler needs (+thumb placeholder)
      allowed = %w[code type kind_label brand subtype notes locked sample hidden sample_received name number thumb]
      cols = cols & allowed
      CSV.generate do |csv|
        csv << cols
        rows.each do |r|
          csv << cols.map{|k|
            case k
            when 'locked','sample','hidden','sample_received' then r[k.to_sym] ? '1':'0'
            when 'thumb' then ''
            else r[k.to_sym]||''
            end
          }
        end
      end
    end
  end
end
