var spawn = require('child_process').spawn;
var fs = require ('fs');
var Q = require('q');

// Child-process variable
var exif = {};
// Child-process state
var isLoaded = false;

// integer (incremented) key to current exif request
var index = 0;
// Properly scoped callback object, properties correspond to index and callbacks
var callbacks = {};

exif.stderr.on('data', function(err) {
  console.log('Error: ' + err.toString());
});
var exifString = '';
exif.stdout.on("data", function(data) {
  //console.log(data.toString());
  exifString += data;
  if (/\{ready\d{1,8}\}/mi.test(exifString)) {
    var rtnArray = /([\s\S]*)\{ready(\d{1,8})\}/mi.exec(exifString);
    var rtn = rtnArray[1];
    var idx = rtnArray[2];
    //console.log(idx,callbacks);
    var callback = callbacks['ix' + idx.toString()];
    callback(rtn);
    delete callbacks['ix' + idx.toString()];
    exifString = exifString.replace(rtn + '{ready' + idx + '}','');
  }
});

/**
  load the exiftool
**/
var load = function(exiftoolPath) {
  exiftoolPath = exiftoolPath || './vendor/exiftool/exiftool.exe'
  exif = spawn(exiftoolPath, ['-stay_open','True', '-@','-']);
  isLoaded = true;
};
exports.load = load;

exports.parse = function(filePath,args,callback) {
  if (!isLoaded) load();
  var deferred = Q.defer();
  var flags = '';
  for (var i = 0; i < args.length; i++) flags += args[i] + '\n';
  var command = flags + filePath.replace(/\\/g,'/') + '\n-execute' + ++index + '\n';
  //console.log(command);
  exif.stdin.write(command);
  callbacks['ix' + index.toString()] = callback;
}
exports.parsePromise = function(file) {
  var deferred = Q.defer();
  var flags = '';
  for (var i = 0; i < args.length; i++) flags += args[i] + '\n';
  var commands = flags + file.replace(/\\/g,'/') + '\n-execute' + ++index + '\n';
  //console.log(commands);
  exif.stdin.write(commands);
  callbacks[index.toString()] = function(data) {
    deferred.resolve(data);
  }
  return deferred.promise;
}
exports.unload = function() {
  exif.stdin.write('stay_open\nFalse\n');
  exif.disconnect();
  isLoaded = false;
}
