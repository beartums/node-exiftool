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
var successCBs = {};
var failureCBs = {};
var exifString = '';

/**
  Check if the exif data retruned is complete (has '{ready#}'), and process
  @param {object} useCBs callback objects to be used in this instance
  @param {object} removeCBs callback objects only to be removed if the string is complete
**/
function tryComplete(useCBs,removeCBs) {
  if (/\{ready\d{1,8}\}/mi.test(exifString)) {
    var rtnArray = /([\s\S]*)\{ready(\d{1,10})\}/mi.exec(exifString);
    var rtn = rtnArray[1]; // String to be returned
    var idx = rtnArray[2]; // Index number pointing to callback object
    var callback = useCBs['ix' + idx.toString()];
    callback(rtn);
    // String is complete and returned, remove success and failure callbacks
    delete useCBs['ix' + idx.toString()];
    delete removeCBs['ix' + idx.toString()];
    // clean up callback string for the next item to be processed
    exifString = exifString.replace(rtn + '{ready' + idx + '}','');
  }
}

/**
  load the exiftool
**/
var load = function(exiftoolPath) {
  exiftoolPath = exiftoolPath || './vendor/exiftool/exiftool.exe'
  try {
    exif = spawn(exiftoolPath, ['-stay_open','True', '-@','-']);
  } catch(e) {
    console.log("Err: exiftool not loaded")
    console.log(e.toString());
    return;
  }
  isLoaded = true;
  exif.stderr.on('data', function(err) {
    //console.log('Error: ' + err.toString());
    exifString += err.toString();
    tryComplete(failureCBs,successCBs);
  });
  exif.stdout.on("data", function(data) {
    //console.log(data.toString());
    exifString += data;
    tryComplete(successCBs,failureCBs);
  });
};
exports.load = load;

/**
  Use passed callback as the success function
  @param {string} filePath Full path to the file
  @param {array} args array of arguments for exiftool
  @param {function} callback Recieving the object returned from exiftool
**/
exports.parse = function(filePath,args,callback, failure) {
  runCommand(filePath,args, callback, failure);
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
  }, function(data) {
    deferred.reject(data);
  });
  return deferred.promise;
}
/**
  Actual processing required to get exiftool to run the command
  @param {string} filePath Full path to the file
  @param {array} args array of arguments for exiftool
  @param {function} cb Recieving the object returned from exiftool
**/
function runCommand(filePath, args, cb, failure) {
  if (!isLoaded) load();  // load exiftool, if not loaded
  successCBs['ix' + index.toString()] = cb; // queue and index the sucess callback
  failureCBs['ix' + index.toString()] = failure; // queue and index the failure callback
  var flags = '';
  for (var i = 0; i < args.length; i++) flags += args[i] + '\n';
  var command = flags + filePath.replace(/\\/g,'/') + '\n-execute' + index++ + '\n';
  exif.stdin.write(command);
}

exports.unload = function() {
  try {
    exif.stdin.write('-stay_open\nFalse\n');
    //exif.kill();
    //exif = {};
  } catch(e) {
    console.log('Err: could not unload exif')
    console.log(e.toString());
    return;
  }
  isLoaded = false;
}
