var spawn = require('child_process').spawn;
var fs = require ('fs');
var Q = require('q');

var exif = spawn('./vendor/exiftool/exiftool.exe', ['-stay_open','True', '-@','-']);

var index = 0;
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
exports.load = function() {

}
exports.parse = function(filePath,args,callback) {
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
  var flags = '-j\n-g\n-u\n'
  var commands = flags + file.replace(/\\/g,'/') + '\n-execute' + ++index + '\n';
  //console.log(commands);
  exif.stdin.write(commands);
  callbacks[index.toString()] = function(data) {
    deferred.resolve(data);
  }
  return deferred.promise;
}
