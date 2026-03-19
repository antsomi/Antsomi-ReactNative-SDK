Pod::Spec.new do |spec|
  spec.name = 'boost'
  spec.version = '1.83.0'
  spec.license = { :type => 'Boost Software License' }
  spec.homepage = 'http://www.boost.org'
  spec.summary = 'Boost provides free peer-reviewed portable C++ source libraries.'
  spec.authors = 'Rene Rivera'
  spec.source = { :path => './Pods/boost' }
  spec.platforms = { :ios => '13.4' }
  spec.requires_arc = false
  spec.module_name = 'boost'
  spec.header_dir = 'boost'
  spec.preserve_path = 'boost'
end
