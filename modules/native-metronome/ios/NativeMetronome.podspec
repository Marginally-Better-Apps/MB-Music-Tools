Pod::Spec.new do |s|
  s.name           = 'NativeMetronome'
  s.version        = '1.0.0'
  s.summary        = 'Sample-accurate iOS metronome clock for MB Music Tools'
  s.description    = 'Generates and loops a native PCM click at the selected tempo.'
  s.license        = { :type => 'MIT' }
  s.author         = 'Marginally Better Apps'
  s.homepage       = 'https://github.com/Marginally-Better-Apps/MB-Music-Tools'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { :git => 'https://github.com/Marginally-Better-Apps/MB-Music-Tools.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.swift'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
