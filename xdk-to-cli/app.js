/**
 * For converting an intelxdk.config.{android|ios|windows}.xml file into a
 * PhoneGap Build and Cordova CLI compatible config.xml file.
 *
 * Copyright (c) 2016-2017, Paul Fischer, Intel Corporation
 * See the LICENSE.md file for license terms and conditions.
 * See the README.md file for instructions, requirements and limitations.
 */

// spec jslint and jshint lines for desired JavaScript linting
// see http://www.jslint.com/help.html and http://jshint.com/docs
/* jslint node:true */
/* jshint unused:true */

"use strict" ;

var minNode = "4.0" ;           // minimum required Node.js version
process.exitCode = 0 ;          // just to be sure we exit gracefully


versionNodeCheck(minNode) ;     // checks Node.js version
if( process.exitCode )          // exit if we have a non-zero exitCode lying around
    process.exit() ;


// Now get to work reading in lines from the Intel XDK config files and converting
// them into a config.xml file for use with PhoneGap Build and Cordova CLI.

var readline = require("readline") ;
var rl = readline.createInterface({
    input: process.stdin
}) ;


/**
 * First pass conversion to convert an intelxdk.config.{android|ios|windows}.xml
 * file into a PhoneGap Build and Cordova CLI config.xml compatible file.
 *
 * A better first pass would be to make sure that each line in the file contains
 * only a single XML tag. This could then be rewritten as the second-pass operation.
 *
 * @function
 * @param {String} lineIn - one line of input from the file being converted
 * @return {null} - no useful return value
 * @author Paul Fischer, Intel Corporation
 */

var onLine = function(lineIn) {
    var self = onLine ;                         // to manage static local variables
    self.lineArray = self.lineArray || [] ;     // to manage the incoming XML file

    self.lineArray.push(lineIn) ;               // push entire file into an array
} ;
rl.on('line', onLine) ;


var onClose = function() {
    var self = onClose ;                        // to manage static local variables
    var i, j, k, x, y, z, fs ;                  // various temp vars
    var nameTag = null ;                        // for deducing which config file we are parsing
    var projectJson = {} ;                      // to hold contents of the <project>.xdk file

    self.parseTag = "widget" ;                  // default parse level is the <widget> tag
    self.orgArray = onLine.lineArray ;          // get pointer to file we read in
    self.pass1Array = self.orgArray.slice() ;   // get copy of old array
    self.pass2Array = [] ;
    self.pass3Array = [] ;


// First pass breaks lines with multiple tags into multiple lines.
// In essence, we want each array element to consist of a single XML tag.

    for( i=10 ; i>0 ; i-- ) {
        if( !splitMultipleTagLines(self.pass1Array) ) {
            break ;                             // quit if no multi-tag lines detected
        }
        else if( i <= 1 ) {                     // if we hit the limits of our patience
            process.exitCode++ ;                // get out of here
            console.error("WARNING: possible conversion problems; too many tags on a single-line.") ;
            break ;
        }
    }


// Second pass marks comments in the array, so we can ignore in future passes.

    // create a new two-dimensional array to hold our comment markers

    for( i = 0 ; i < self.pass1Array.length ; i++ ) {
        (function() {                           // jshint ignore:line
            var tmpArray = [] ;
            tmpArray[0] = i ;
            tmpArray[1] = self.pass1Array[i] ;
            self.pass2Array.push(tmpArray) ;
        }()) ;
    }


    // add a comment that indicates the resulting config file was written
    // by this script and the date and time at which it was written
    // written as a comment directly under the <widget> tag

    self.pass2Array.forEach(function(line, index, array) {
        if( /<widget.*>/.test(line) ) {
            var d = new Date() ;
            var x = ['C', "<!-- This config.xml file created by " + __filename + " at " + d.toLocaleString() + " -->"] ;
            array.splice(index+1, 0, x) ;
        }
    }) ;


    // find single-line comments and mark them
    // remember that we can assume only one tag per line now

    self.pass2Array.forEach(function(line) {
        var x = line[1].search(/<\!\-\-.*\-\->/) ;
        if( x !== -1 ) {                        // if we found a comment on one line
            line[0] = 'C' ;                     // mark it as a comment line
        }
    }) ;


    // now find multi-line comments and mark them
    // we also have to find the closing comment marker, on a subsequent line
    // this will work as long as we don't have any multi-tag lines

    for( i = 0 ; i < self.pass2Array.length ; i++ ) {
        if( (self.pass2Array[i][0] !== 'C') && (self.pass2Array[i][1].search(/<\!\-\-/) !== -1) ) {
            do {
                self.pass2Array[i++][0] = 'C' ;
            } while( (self.pass2Array[i][1].search(/\-\->/) === -1) && (i < self.pass2Array.length) ) ;
            self.pass2Array[i][0] = 'C' ;
        }
    }


// Third pass translates XDK-specific tags into corresponding PhoneGap/Cordova tags.
// And find the <name> tag so we can use it later to parse the <project-name>.xdk file.

    for( i = 0 ; i < self.pass2Array.length ; i++ ) {
        self.pass3Array[i] = ["",""] ;
        self.pass3Array[i][0] = self.pass2Array[i][0] ;
        if( self.pass2Array[i][0] === 'C' ) {
            self.pass3Array[i][1] = self.pass2Array[i][1] ;
        }
        else {
            self.pass3Array[i][1] = tagConvert(self.pass2Array[i][1]) ;

            if( !nameTag ) {
                nameTag = self.pass2Array[i][1].match(/<name>(.*)<\/name>/) ;
                if( nameTag ) {
                    nameTag = nameTag[1] ;      // get "string" from the <name>string</name> tag
                }
            }
        }
    }


// Fourth pass is needed to collect Crosswalk command-line options into a single
// preference tag, otherwise the extras are ignored by the Crosswalk plugin. We
// ignore comment lines, in case they have Crosswalk options embedded in them.

    // NOTE: zeroth element will not be a match, thus reason z=0 is safe.
    // NOTE: some lines converted to comments by third pass are not marked as comments,
    // but those will not match what we are looking for, so those are safe.

    for( i=0, y=[], z=0 ; i < self.pass3Array.length ; i++ ) {
        if( self.pass3Array[i][0] !== 'C' ) {
            x = self.pass3Array[i][1].match(/<intelxdk:crosswalk.+xwalk\-command\-line=\"([^\"]+)\"/) ;
            if( x ) {
                if( z === 0 ) z = i ;               // remember location of first find, for later
                self.pass3Array[i][0] = 'C' ;       // turn XDK version into a comment line
                self.pass3Array[i][1] = self.pass3Array[i][1].replace("--", "- -") ;
                self.pass3Array[i][1] = "<!-- " + self.pass3Array[i][1] + " -->" ;
                y.push(x[1]) ;                      // remember the command-line options we find
            }
        }
    }

    if( z > 0 ) {               // if we found at least one xwalk-command-line preference tag
        for( i=0, x="" ; i < y.length ; i++ ) {
            x += y[i] + " " ;   // combine all command-line options we found into a single string
        }
        self.pass3Array.splice(z, 0, [z, '<preference name="xwalkCommandLine" value="' + x.trim() + '"/>']) ;
    }


// Fifth pass collects plugin data from <project-name>.xdk file to be
// used to fixup the <plugin> tags we've converted so that those which
// originate from a git repo will be properly identified in the final
// config.xml file.

    // assemble the name of the <project-name>.xdk file (i.e., "string.xdk")
    // based on the <name> tag that we found during a previous pass (above)
    if( nameTag )
        nameTag += ".xdk" ;

    // read in the <project-name>.xdk JSON object
    if( nameTag ) {
        fs = require('fs') ;
        try {
            projectJson = JSON.parse(fs.readFileSync(nameTag, "utf8")) ;
        } catch(err) {
            console.error("ERROR: readFileSync had trouble reading: " + nameTag + "; perhaps an invalid <name> tag?") ;
            console.error("  readFileSync error message: " + err.message) ;
            projectJson = {} ;
        }
    }

    // find all non-NPM plugin references and update them in our config.xml array
    /*
     * Use the following rules to transform non-NPM <plugin> specs:
     *
     * Inspect the <project-name>.xdk file and identify all plugins found
     * in the "cordovaPlugins": [] array that have either of these properties:
     *
     * "originType": "local"
     * "originType": "repo".
     *
     * For "originType": "local":
     * - issue a warning that this plugin was added as a local plugin
     * - use "id", "name" and "version" properties to identify it
     * - may not work with PhoneGap Build, which may not be able to locate it
     * - if modification of public plugin, PGB will not see the modifications
     *
     * For "originType": "repo":
     * - convert to git format; "spec" field needs to replaced with git reference
     * - replace "spec" string with concatenation of "origin" and "gitref" properties
     * - separate "orgin" and "gitref" with # character.
     * - for example, from this:
     *   <plugin name="my-plugin-name" spec="1.2.3" />
     * - to this:
     *   <plugin name="my-plugin-name" spec="https://github.com/apache/my-cordova-plugin-repo#v3.2.1" />
    */
    y = [] ;
    if( projectJson && projectJson.project && projectJson.project.cordovaPlugins ) {
        for( x in projectJson.project.cordovaPlugins ) {
            y.push(projectJson.project.cordovaPlugins[x]) ;             // make copy of the plugins array
        }
        for( z in y ) {
            if( y[z].originType && (y[z].originType === "local") ) {    // plugin was a "local import"
                i = "WARNING: regarding plugin '" + y[z].id + "' (" + y[z].name + "):" ;
                j = "  Plugin was imported locally and may not work with Adobe PhoneGap Build." ;
                k = "  Locally imported plugins may not work if the plugin is private or modified." ;
                console.error(i) ;
                console.error(j) ;
                console.error(k) ;

                // find the plugin in the pass3Array and add warning above as a comment
                j = new RegExp('<plugin\\sname="' + y[z].id + '"') ;
                for( i = 0 ; i < self.pass3Array.length ; i++ ) {
                    if( self.pass3Array[i][0] !== 'C' ) {
                        if( self.pass3Array[i][1].match(j) ) {
                            self.pass3Array[i][1] += "<!-- " + k + " -->" ;
                        }
                    }
                }
            }
            if( y[z].originType && (y[z].originType === "repo") ) {     // plugin is from a "git repo"
                i = "NOTE: regarding plugin '" + y[z].id + "' (" + y[z].name + "):" ;
                j = "  Plugin was added via a git repo, not the Cordova NPM plugin registry." ;
                k = "  If available via Cordova registry; consider changing to an NPM reference." ;
                console.error(i) ;
                console.error(j) ;
                console.error(k) ;

                // find the plugin in the pass3Array and replace "spec" with origin or origin#gitref
                j = new RegExp('<plugin\\sname="' + y[z].id + '"') ;
                for( i = 0 ; i < self.pass3Array.length ; i++ ) {
                    if( self.pass3Array[i][0] !== 'C' ) {
                        if( self.pass3Array[i][1].match(j) ) {
                            if( y[z].gitref )
                                self.pass3Array[i][1] = self.pass3Array[i][1].replace(/spec=\"([^\"]+)\"/, "spec=\"" + y[z].origin + "#" + y[z].gitref + "\"") ;
                            else
                                self.pass3Array[i][1] = self.pass3Array[i][1].replace(/spec=\"([^\"]+)\"/, "spec=\"" + y[z].origin + "\"") ;
                            self.pass3Array[i][1] += "<!-- " + k + " -->" ;
                        }
                    }
                }
            }
        }
    }


// Finally! We can send the result to stdout!!

    self.pass3Array.forEach(function(row) {
        console.log(row[1]) ;                   // print state of config.xml to stdout
    }) ;

    process.exit() ;
} ;
rl.on('close', onClose) ;



/**
 * Performs XDK tag substitution.
 * Called one line at a time. Returns the translated line.
 *
 * @function
 * @param {String} line - incoming line to be converted
 * @return {String} - the converted line
 * @author Paul Fischer, Intel Corporation
 */

var tagConvert = function(line) {
    var x, y, z ;                               // temp vars
    var self = tagConvert ;                     // to manage static local variables

    self.parseTag = self.parseTag || "widget" ; // default parse is the <widget> tag

    if( self.parseTag === "widget" ) {          // the default parse case (most commonly encountered)
        switch( true ) {                        // see http://stackoverflow.com/a/2896642/2914328

            // remove excess XDK namespace from <widget> tag
            case /<widget.*>/.test(line):
                line = line.replace('xmlns:intelxdk="http:\/\/xdk.intel.com\/ns\/v1" ', '') ;
                break ;

            // delete the <intelxdk:version> tag
            // Android only, delete "debuggable = true" tag (specific to XDK build system)
            case /<intelxdk:version.*>/.test(line):
            case /<intelxdk:provisioning.*>/.test(line):
            case /<preference\s+name=\"debuggable\"/.test(line):
                line = "<!-- " + line + " -->" ;
                break ;

            // convert the XDK cli spec into a PhoneGap compatible CLI version spec
            case /<intelxdk:cordova-cli.*>/.test(line):
                if( line.search(/version=\"6\.2\.0\"/) != -1 )
                    line = '<preference name="phonegap-version" value="cli-6.2.0" />' + "<!-- " + line + " -->" ;
                else if( line.search(/version=\"5\.4\.1\"/) != -1 )
                    line = '<preference name="phonegap-version" value="cli-6.0.0" />' + "<!-- " + line + " -->" ;
                else
                    line = '<preference name="phonegap-version" value="cli-5.2.0" />' + "<!-- " + line + " -->" ;
                break ;

            // convert XDK plugin spec into Cordova CLI plugin spec
            case /<intelxdk:plugin.*>/.test(line):
                x = line.match(/intelxdk:value=\"[^\"]+\"/)[0] ;
                y = line.match(/intelxdk:version=\"[^\"]+\"/)[0] ;
                z = /<intelxdk:plugin.*\/>/.test(line) ? true : false ;
                line = '<plugin name=' + x.match(/\".*\"/)[0] + ' ' + 'spec=' + y.match(/\".*\"/)[0] ;
                if( z ) {
                    line += ' \/>' ;            // located a single-line plugin tag
                }
                else {
                    line += ' >' ;              // located a multi-line plugin tag
                    self.parseTag = "plugin" ;  // requires additional processing of variables
                }
                break ;

            // Android only, convert Crosswalk version specifier
            case /<intelxdk:crosswalk\s+version.*>/.test(line):
                x = line.match(/version=\"([0-9]+|shared)\"/)[1] ;
                if( x === "shared") {
                    line = "<!-- " + line + " --> " ;
                    line += '<preference name="xwalkMode" value="shared" /> ' ;
                    line += '<plugin name="cordova-plugin-crosswalk-webview" spec="1.8.0" />' ;
                }
                else {
                    x = parseInt(x) ;
                    line = "<!-- " + line + " --> " + '<preference name="xwalkMultipleApk" value="false" /> ' ;
                    if( x >= 20 )
                        line += '<plugin name="cordova-plugin-crosswalk-webview" />' ;
                    else if( x == 19 )
                        line += '<plugin name="cordova-plugin-crosswalk-webview" version="1.8.0" />' ;
                    else if( x == 18 )
                        line += '<plugin name="cordova-plugin-crosswalk-webview" version="1.7.2" />' ;
                    else if( x == 17 )
                        line += '<plugin name="cordova-plugin-crosswalk-webview" version="1.6.1" />' ;
                    else if( x == 16 )
                        line += '<plugin name="cordova-plugin-crosswalk-webview" version="1.5.0" />' ;
                    else
                        line += '<plugin name="cordova-plugin-crosswalk-webview" version="1.4.0" />' ;
                }
                break ;

            // Android only, remove xwalkVersion spec (used by Crosswalk plugin)
            // because it causes problems with Adobe PhoneGap Build
            // might be included in the intelxdk.config.additions.xml file
            case /<preference\sname=\"xwalkVersion\".*>/.test(line):
                line = "<!-- " + line + " --> " + "<!-- Does not work with Adobe PhoneGap Build -->" ;
                break ;

            // iOS only, add 'platform="ios"' to <preference name="deployment-target" value="#.#"/> tag
            case /<preference\s+name=\"deployment-target\".*>/.test(line):
                line = line.replace(/name=\"deployment-target\"/, 'platform="ios" $&') ;
                break ;

            // Windows only, change <preference name="windows-publisher-display-name"> tag
            case /<preference\s+name=\"windows-publisher-display-name\".*>/.test(line):
                line = line.replace("windows-publisher-display-name", "WindowsStorePublisherName") ;
                break ;

            // Windows only, change <preference name="windows-capabilities"> tag
            case /<preference\s+name=\"windows-capabilities\".*>/.test(line):
                line = "<!-- ERROR: unable to convert: " + line + " -->" ;
                break ;

            // most lines can be passed thru without any changes
            default:
                break ;
        }
        return line ;
    }

    if( self.parseTag === "plugin" ) {          // for plugins that include variables
        switch( true ) {                        // see http://stackoverflow.com/a/2896642/2914328

            // found an internal <intelxdk:param> tag
            case /<intelxdk:param/.test(line):
                line = line.replace("intelxdk:param", "variable") ;
                line = line.replace("intelxdk:name", "name") ;
                line = line.replace("intelxdk:value", "value") ;
                break ;

            // found a closing </intelxdk:plugin> tag
            case /<\/intelxdk:plugin/.test(line):
                line = line.replace("intelxdk:plugin", "plugin") ;
                self.parseTag = "widget" ;      // go back to processing main level
                break ;

            // only thing that should show up here are blank lines or comments
            default:
                break ;
        }
        return line ;
    }
} ;



/**
 * Locates multiple XML tags on a single line and converts to multiple lines.
 * Returns false if none were found, true if some were found.
 *
 * Call it again if true returned, might be more multi-tag lines to find,
 * because the regex expression used in not exhaustive and it only performs
 * a single split upon finding a match!
 *
 * @function
 * @param {Array} array - array of string literals
 * @return {Boolean} - true if we had to split a line
 * @author Paul Fischer, Intel Corporation
 */

function splitMultipleTagLines(array) {
    var i, x, y, z ;                        // temp vars
    var result = false ;                    // means we did not find any lines to split

    for( i = 0 ; i < array.length ; i++ ) {
        z = array[i].search(/>\s*</) ;      // see if we can find ">   <" on the same line
        if( z !== -1 ) {                    // if we found a multi-tag line
            x = array[i].substr(0,z+1) ;    // split into two strings
            y = array[i].substr(z+1) ;

            array[i] = x ;                  // and put two strings back into the array
            array.splice(i+1, 0, y) ;

            i++ ;                           // to accommodate for additional row we inserted
            result = true ;                 // we found at least one line that needed to be split
        }
    }
    return result ;
}



/**
 * Confirms that we have a version of Node.js that works
 * with this version of the script.
 *
 * If we detect an incompatible version, return false.
 *
 * @function
 * @param {String} minNodeVersion - minimum required Node.js version string
 * @return {Boolean} - true if "all systems go"
 * @author Paul Fischer, Intel Corporation
 */

function versionNodeCheck(minNodeVersion) {
    var ver = {} ;                  // reference to the version compare helper module

    if (typeof minNodeVersion != "string") {
        process.exitCode++ ;
        console.error("Bad minimum Node.js version specified: \'" + minNodeVersion + "\'") ;
        return false ;
    }

    // Confirm we have correct version of Node.js for running this script.

    ver = getModule(__dirname + "/" + "version-compare.js") ;
    if( typeof ver === "undefined" ) {
        process.exitCode++ ;
        return false ;
    }
    if( ver.versionCompare(process.versions.node, minNodeVersion) < 0 ) {
        process.exitCode++ ;
        console.error("Node.js version: " + process.versions.node) ;
        console.error("Node.js version is too old, upgrade to version " + minNodeVersion + " or greater.") ;
        return false ;
    }
    else
        return true ;
}



/**
 * Helper function to load required local JavaScript module.
 * Essentially does a "require" with some extra error checking.
 * Will return the module or "undefined" to indicate a failure.
 *
 * @function
 * @param {String} moduleName - name of the JS file to "require"
 * @return {...} - normally returns whatever the module returns from a require
 * @author Paul Fischer, Intel Corporation
 */

function getModule(moduleName) {
    try {
        require.resolve(moduleName) ;
    }
    catch(e) {
        console.error("Missing local node module or file: " + moduleName) ;
//        console.error(e) ;
        return undefined ;
    }
    return require(moduleName) ;
}
