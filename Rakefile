require 'etc'

RakeFileUtils.verbose_flag = false

task :default => 'gravatar-zoom.oex'

desc 'build everything'
task :all => %w(gravatar-zoom.oex)

desc 'cleanup'
task :clean do |t|
  verbose(true) { rm_rf FileList['build', 'gravatar-zoom.*'] }
end

desc 'opera extension'
file 'gravatar-zoom.oex' => FileList["opera/*", "*.js"] do |t|
  announce t
  rm_rf 'build'
  mkdir 'build'
  cp_r 'opera', 'build/opera'
  mkdir 'build/opera/includes'
  cp 'jquery-1.7.2.min.js', 'build/opera/includes/'
  cp 'gravatar-zoom.user.js', 'build/opera/includes/'
  cd 'build/opera' do
    sh "zip -qrmD9 ../../gravatar-zoom.oex *"
  end
end

desc 'Chrome extension'
file 'gravatar-zoom.zip' => FileList["chrome/*", "*.js"] do |t|
  announce t
  rm_rf 'build'
  mkdir 'build'
  cp_r 'chrome', 'build/chrome'
  cp 'jquery-1.7.2.min.js', 'build/chrome/'
  cp 'gravatar-zoom.user.js', 'build/chrome/'
  #build_zip t.name, 'build/chrome', 'chrome.pem'
  cp 'chrome.pem', 'build/chrome/key.pem'
  cd 'build' do
    rm_f 'chrome/.DS_Store'
    sh "zip -qrD9 ../gravatar-zoom.zip chrome"
  end
end

def announce(task, action = 'building')
  puts "#{action} #{task.name}"
end

def build_zip(zip_output, ex_dir, pkey)
  rm zip_output if File.exists? zip_output
  cp pkey, "#{ex_dir}/key.pem"
  cd 'build' do
    rm_f '.DS_Store'
    sh 'zip', '-qrD9', "../#{zip_output}", File.basename(ex_dir)
  end
  rm "#{ex_dir}/key.pem"
end
