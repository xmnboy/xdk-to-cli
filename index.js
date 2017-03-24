#!/usr/bin/env node

/**
 * @file
 * Command-line processing and general coordination for xdk-to-cli.js.
 * See the included README.md file for more information.
 *
 * @author Paul Fischer, Intel Corporation
 *
 * @copyright (c) 2016-2017, Intel Corporation
 * @license BSD-3-Clause
 * See LICENSE.md for complete license terms and conditions.
 */

/* spec jslint and jshint lines for desired JavaScript linting */
/* see http://www.jslint.com/help.html and http://jshint.com/docs */
/* jslint node:true */
/* jshint unused:true */

"use strict" ;



var fs = require("fs") ;
var path = require("path") ;
var child = require("child_process") ;      // will be used for process spawn
var xdkProjFileName = process.argv[2] ;     // required input argument



/**
 * Checks on startup to see if the script argument(s) provided on the command-
 * line are good. If not, we generate a usage message and exit. We must get
 * past this point before we can generate a config.xml file.
 *
 * @function
 * @param {String} xdkFileName - name of the <project>.xdk file to be processed
 * @return {null} - no useful return value
 */

(function(xdkFileName) {
    process.exitCode = 0 ;
    if( typeof xdkFileName === "undefined" ) {  // no input argument
        process.exitCode = 1 ;
        errMsgExit() ;
    }
    if( !(fs.existsSync(xdkFileName)) ) {       // file does not exist
        process.exitCode = 2 ;
        errMsgExit() ;
    }
    if( !(/\.xdk$/.test(xdkFileName)) ) {       // filename does not end in ".xdk"
        process.exitCode = 3 ;
        errMsgExit() ;
    }

    // Simple helper function to augment the input checking logic above.
    // If the above calls this function it means problems and a process.exit().

    function errMsgExit() {
        switch(process.exitCode) {
            case 1:
                console.error("ERROR: <project-name>.xdk argument required.") ;
                break ;

            case 2:
                console.error("ERROR: \"" + xdkFileName + "\" file does not exist.") ;
                break ;

            case 3:
                console.error("ERROR: \"" + xdkFileName + "\" does not appear to be a <project-name>.xdk file.") ;
                break ;

            default:
                console.error("Unknown error.") ;
                break ;
        }
        console.error("Usage: " + path.basename(process.argv[1]) + "  path/to/project/<project-name>.xdk" ) ;
        console.error("Where: <project-name>.xdk is located in the root of your Intel XDK project folder.") ;
        console.error("Exit code " + process.exitCode + ".") ;
        process.exit() ;
    }
})(xdkProjFileName) ;



/*
 * Now, run the xdk-to-cli.js script, as a child process. Provide the
 * respective intelxdk.config.*.xml file to each pass of the spawned process.
 * Print appropriate error messages if we encounter any issues.
 */

var cfgFileIn = "" ;            // for name of intelxdk.config.TARGET.xml file
var cfgFileOut = "" ;           // for name of config.TARGET.xml file (output)
var inputStream = {} ;          // stream object for redirecting spawn stdin
var outputStream = {} ;         // stream object for redirecting spawn stdout
var targetPlatform = [] ;       // array of Cordova target platform names
var index = 0 ;                 // for indexing thru the targetPlatform array

var nodePath = process.argv[0] ;
var scriptPath = path.join(__dirname, "xdk-to-cli.js") ;
var projectDir = path.dirname(xdkProjFileName) ;

// Apologizing in advance for the following hack which is used to get
// sequential asynchronous behavior from an asynchronous function.

// We need to process through the array of Cordova targets, one-by-one. To do
// that, we kick the process off by calling the "onClose" event handler for
// the spawned script object we get when we spawn the actual working script
// (in other words, the first time through there is no event, we fake "close"
// event by calling the event handler directly). After that initial "kick in
// the pants" we will get real "close" events with the completion of each
// actual spawned script process.

// It is very important that the "close" event assignment happen *AFTER* the
// spawn object reference is acquired and *WHILE* that object ref pointer
// still exists, otherwise you will lose the event and get stuck. This is why
// we are using this "kick in the pants" technique, to keep those two together
// and in the right order.

// Also, we are using the "close" event rather than the "exit" event because
// we are referencing the stdio streams from the spawned script, which may not
// be fully closed when we get the "exit" event, and could truncate the
// output.

targetPlatform = ["windows","ios","android"] ;
index = targetPlatform.length-1 ;
spawnClose(0) ;

function spawnClose(code) {
    var spawnObj = {} ;         // for pointing to the returned spawn object

    if( code ) {
        process.stderr.write("\n") ;
        process.stderr.write("WARNING: non-zero exit code returned.\n") ;
        process.exit(code) ;
    }
    if( index<0 ) {
        process.stderr.write("\n") ;
        process.stderr.write("SUCCESS: finished!\n") ;
        process.exit(0) ;
    }
    else {
        spawnObj = createConfigXml(targetPlatform[index--]) ;
        spawnObj.on("close", spawnClose) ;
    }
}



/**
 * Spawns a second script that creates a config.<target>.xml file based on the
 * input of three key Intel XDK project files: the <project-name>.xdk file,
 * the intelxdk.config.additions.xml file and the intelxdk.config.<target>.xml
 * file. Where <target> is the platform target of interest. The only tested
 * <target> platforms are android, ios and windows.
 *
 * @function
 * @param {String} target - Cordova target to be processed
 * @return {Object} - the "spawn" object being used to run the second script
 */

function createConfigXml(target) {
    var spawn = {} ;                // holds the child.spawn object

    cfgFileIn = path.join(projectDir, "intelxdk.config." + target + ".xml") ;
    cfgFileOut = path.join(projectDir, "config." + target + ".xml") ;

    console.error(" ") ;
    console.error("Creating " + cfgFileOut) ;

    if( fs.existsSync(cfgFileIn) ) {
        try {
            inputStream = fs.createReadStream(cfgFileIn) ;
            outputStream = fs.createWriteStream(cfgFileOut) ;
            spawn = child.spawn(nodePath, [scriptPath,xdkProjFileName]) ;

            // process.stdin.resume() ;
            // spawn.stdin.resume() ;

            // below+above is equivalent to: node scriptPath xdkProjFileName <cfgFileIn >cfgFileOut
            inputStream.pipe(spawn.stdin) ;     // cat cfgFileIn | node scriptPath xdkProjFileName
            spawn.stdout.pipe(outputStream) ;   // node scriptPath xdkProjFileName | cat >cfgFileOut
            spawn.stderr.pipe(process.stderr) ; // reroute spawned app's stderr to this app's stderr
        }
        catch(error) {
            console.error("ERROR: " + nodePath + " " + scriptPath + " " + xdkProjFileName + " <" + cfgFileIn + " >" + cfgFileOut) ;
            console.error("Error code: " + error.code) ;
            process.exit(4) ;
        }
    }
    else {
        console.error("ERROR: no " + cfgFileIn + " file, check your project folder " + projectDir) ;
        process.exit(5) ;
    }

    return spawn ;          // this is being done as a programming convenience
}



/*
 * Following is the original shell script that was reimplemented above.
 * Left here for reference, might make it easier to understand the above.
 */

/*
if [ -f "${projectDir}/intelxdk.config.android.xml" ]; then
  node "${scriptDir}/xdk-to-cli/app.js" "$1" <"${projectDir}/intelxdk.config.android.xml" >"${projectDir}/config.android.xml"
  echo "SUCCESS: config.android.xml file created from intelxdk.config.android.xml file."
  echo
else
  echo "ERROR: no intelxdk.config.android.xml file, check your project folder (${projectDir})."
  echo
fi


if [ -f "${projectDir}/intelxdk.config.ios.xml" ]; then
  node "${scriptDir}/xdk-to-cli/app.js" "$1" <"${projectDir}/intelxdk.config.ios.xml"     >"${projectDir}/config.ios.xml"
  echo "SUCCESS: config.ios.xml file created from intelxdk.config.ios.xml file."
  echo
else
  echo "ERROR: no intelxdk.config.ios.xml file, check your project folder (${projectDir})."
  echo
fi


if [ -f "${projectDir}/intelxdk.config.windows.xml" ]; then
  node "${scriptDir}/xdk-to-cli/app.js" "$1" <"${projectDir}/intelxdk.config.windows.xml" >"${projectDir}/config.windows.xml"
  echo "SUCCESS: config.windows.xml file created from intelxdk.config.windows.xml file."
  echo
else
  echo "ERROR: no intelxdk.config.windows.xml file, check your project folder (${projectDir})."
  echo
fi
*/