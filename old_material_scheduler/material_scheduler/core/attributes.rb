module MaterialScheduler
  class Attributes
    KEY='ms'
    def initialize(model); @model=model; @types=[]; end
    def mat_info(mat); d=mat.attribute_dictionary(KEY); d ? d.to_h : nil; end
    def set_mat_info(mat,h); d=mat.attribute_dictionary(KEY,true); h.each{|k,v| d[k]=v}; end
    def set_types(arr); @types=arr; end
    def get_types; @types; end
  end
end
