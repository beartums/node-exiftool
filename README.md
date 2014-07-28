node-exiftool
=============

Javascript wrapper for exiftool, using stay_open for speed with multi-file requests

##Requires
exiftool executable.  You can point to a lacally-installed version with the ```load```
method, otherwise this wrapper will look for it in './vendor/exiftool/exiftool.exe'.

##Methods

###.load(pathToExiftool)

Optional.  If you do not start exiftool with a specific path, the wrapper will start
exiftool on first invocation of the .parse() function.  If you do not specify a path,
the default path will be './vendor/exiftool/exiftool.exe'.

###.parse(pathToFile, exiftoolArgs, callback)

```pathToFile```: Full path and file name of the file from which to extract exifdata.

```exiftoolArgs```: Array of string arguments to be used by exiftool.  As a rule of
thumb, in most cases a space would indicate a new argument.  e.g. ["-j","-g","-u"].

```callback(data)```: Properly scoped callback to be executed on completion.  'data' is
the exif data in the format specified in the arguments, if any.

###.unload()

If you want to shut down the parser (and end the exiftool process running on the cpu),
use this to close and delete the spawned child process.
