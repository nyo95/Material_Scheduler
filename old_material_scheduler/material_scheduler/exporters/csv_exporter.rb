module MaterialScheduler
  module Exporters
    class CSVExporter
      def self.call(snapshot)
        t=Time.now.strftime('%Y%m%d'); model=Sketchup.active_model; name=(model && model.title && !model.title.empty?) ? model.title : 'Untitled'
        path=UI.savepanel('Export CSV', Dir.pwd, "#{t} Material Schedule #{name} 1.csv"); return unless path
        rows=(snapshot[:rows]||[])+(snapshot[:hidden_rows]||[])
        File.open(path,'w'){|f| f.puts 'Code,Brand,Material Type,Type,Notes,Locked,Sample,Received,Hidden'
          rows.each{|r| f.puts [r[:code],r[:brand],r[:type],r[:subtype],r[:notes],r[:locked],r[:sample],r[:sample_received],r[:hidden]].map{|x| %Q{"#{x}"}}.join(',') }
        }
        UI.messagebox('Exported.')
      end
    end
  end
end
