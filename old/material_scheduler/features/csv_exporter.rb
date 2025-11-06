require 'csv'
module MSched
  module CSVExporter
    def self.export(rows, cols)
      cols = cols & %w[code type number brand notes locked sample hidden name kind_label]
      CSV.generate do |csv|
        csv << cols
        rows.each do |r|
          csv << cols.map{|k|
            case k
            when 'locked','sample','hidden' then r[k.to_sym] ? '1':'0'
            else r[k.to_sym]||''
            end
          }
        end
      end
    end
  end
end
