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
var exifString = '';


function testComplete() {
  if (/\{ready\d{1,8}\}/mi.test(exifString)) {
    var rtnArray = /([\s\S]*)\{ready(\d{1,10})\}/mi.exec(exifString);
    var rtn = rtnArray[1];
    var idx = rtnArray[2];
    var callback = callbacks['ix' + idx.toString()];
    callback(rtn);
    delete callbacks['ix' + idx.toString()];
    exifString = exifString.replace(rtn + '{ready' + idx + '}','');
  }
}

/**
  load the exiftool
**/
var load = function(exiftoolPath) {
  exiftoolPath = exiftoolPath || './vendor/exiftool/exiftool.exe'
  console.log(exiftoolPath);
  exif = spawn(exiftoolPath, ['-stay_open','True', '-@','-']);
  isLoaded = true;
  exif.stderr.on('data', function(err) {
    console.log('Error: ' + err.toString());
    exifString += data;
    testComplete();
  });
  exif.stdout.on("data", function(data) {
    //console.log(data.toString());
    exifString += data;
    testComplete();
  });
};
exports.load = load;

/**
  Use passed callback as the success function
  @param {string} filePath Full path to the file
  @param {array} args array of arguments for exiftool
  @param {function} callback Recieving the object returned from exiftool
**/
exports.parse = function(filePath,args,callback) {
  runCommand(filePath,args, callback);
}
/**
  same as parse, but returns a promise of a value rather than running the passed callback
  @param {string} filePath Full path to the file
  @param {array} args array of arguments for exiftool
**/
exports.parsePromise = function(filePath,args) {
  var deferred = Q.defer();
  runCommand(filePath,args, function(data) {
    //console.log('Promise: ' + data);
    deferred.resolve(data);
  });
  return deferred.promise;
}
/**
  Actual processing required to get exiftool to run the command
  @param {string} filePath Full path to the file
  @param {array} args array of arguments for exiftool
  @param {function} cb Recieving the object returned from exiftool
**/
function runCommand(filePath, args, cb) {
  if (!isLoaded) load();  // load exiftool, if not loaded
  callbacks['ix' + index.toString()] = cb; // queue and index the callback
  var flags = '';
  for (var i = 0; i < args.length; i++) flags += args[i] + '\n';
  var command = flags + filePath.replace(/\\/g,'/') + '\n-execute' + index++ + '\n';
  exif.stdin.write(command);
}

exports.unload = function() {
  exif.stdin.write('stay_open\nFalse\n');
  exif.disconnect();
  isLoaded = false;
}
