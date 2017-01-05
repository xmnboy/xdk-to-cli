`xdk-to-cli`
============
See [LICENSE.md](LICENSE.md) for license terms and conditions.


Intel® XDK to `config.xml` for Cordova\* CLI and Adobe\* PhoneGap\* Build
-------------------------------------------------------------------------
This is a Node.js\* script that does most of the work necessary to
convert the `intelxdk.config.{android|ios|windows}.xml` files that
are automatically created by the [Intel® XDK](http://xdk.intel.com)
into `config.xml` files that can be used to build your Intel XDK
project using either Cordova\* CLI or Adobe\* PhoneGap\* Build.

> If you have bug fixes for this script, please send a pull request
> with your recommended fix.

> It is *very important* that the top-level `xdk-to-cli.sh` and
> `xdk-to-cli.bat` master script files be located *alongside* the
> `xdk-to-cli` folder that contains the Node.js JavaScript\* files,
> just as they are organized in this GitHub\* repo.


Script Overview
---------------
This converter does not use a general-purpose XML parser, it uses a
"brute force" method akin to an AWK script and takes advantage of the
format of a typical `intelxdk.config.*.xml` file that has been
generated by a recent release (2016 or 2017) of the Intel XDK.

Some conditions that may cause this script to fail:

- Many XML tags occupying the same line (multi-tag lines).
- `<` and `>` characters embedded within strings in an XML tag preference.
- Using the `intelxdk.config.additions.xml` file [add/remove operations][1].
- Complicated comment "tags," especially if they are embedded or recursive.

Keep your `intelxdk.config.additions.xml` file clean and simple and use only
one XML tag per line to insure the best results with this conversion script.


Script Requirements
-------------------
* This script requires at least [Node.js version 4.0][2] (or higher). It will
  check the Node.js version at runtime and abort if your copy of Node.js is
  inadequate. At this time, it has been developed and tested on Node.js v4.4.3.

* The script is organized into multiple files, which are all required in
  order to run. It does not require any external Node.js modules.

* The script will run on Microsoft\* Windows\* or Apple\* OSX or Ubuntu\*.
  Other versions of Linux\* have not been tested, but it should work.

* When running on Linux or Mac, the master shell script uses the `bash` shell.

* When running on Windows, the master batch file expects the `cmd.exe` shell.


Installing the Script
---------------------
* [Download and install Node.js 4.0][2], or greater, onto your development
  system, if you do not already have at least that version installed.

* [`git clone`][3] or [download a ZIP file][4] of this repo onto your
  development system (and unzip the ZIP file).

* Optionally, include the `xdk-to-cli.sh` or `xdk-to-cli.bat` file in your
  `PATH` environment variable. Be sure to also include the `xdk-to-cli`
  folder in that same location (along with its contents).

* Optionally, add a symbolic link in your `PATH` that points to the
  `xdk-to-cli.sh` or `xdk-to-cli.bat` master script file that you will be
  using. Especially if you want to rename the master script files or locate
  them outside of your `PATH`. The master script files have been
  designed to work with symbolic links and will locate the linked script.


Running the Script
------------------
* `cd` to the root folder of the Intel XDK project for which you want to
  create an Adobe PhoneGap Build or Cordova CLI `config.xml` file.

* Start the master script. Errors will be generated if there are problems,
  otherwise you will see up to three "SUCCESS" messages.

For example, on Windows:

~~~
> master\script\path\xdk-to-cli.bat
SUCCESS: config.android.xml file created from intelxdk.config.android.xml file
SUCCESS: config.ios.xml file created from intelxdk.config.ios.xml file
SUCCESS: config.windows.xml file created from intelxdk.config.windows.xml file
~~~

And on OSX or Linux:

~~~
$ master/script/path/xdk-to-cli.sh
SUCCESS: config.android.xml file created from intelxdk.config.android.xml file
SUCCESS: config.ios.xml file created from intelxdk.config.ios.xml file
SUCCESS: config.windows.xml file created from intelxdk.config.windows.xml file
~~~

As shown above, three `config.*.xml` files are created, in your local Intel
XDK project folder. Each is based on the corresponding `intelxdk.config.*.xml`
file. If you compare the three they will be nearly identical and can be
merged, by hand, into a single `config.xml` file for use with either Adobe
PhoneGap Build or Cordova CLI.

* If you are only building for a single target (e.g., Android) you can simply
  rename the `config.android.xml` file to `config.xml` and you will have what
  you need to use with Adobe PhoneGap Build or Cordova CLI. Likewise, you can
  do the same for the other targets (iOS and Windows).

  The `config.windows.xml` file is based on the `intelxdk.config.windows.xml`
  file, which is based on your Intel XDK Windows 10 UAP project settings.

* To build your app with Adobe PhoneGap Build, create a single `config.xml`
  file (using one of the techniques described above) and place it into the root
  of your project folder (in the same folder as the `config.*.xml` files).
  Then ZIP your project folder and submit the ZIP file to Adobe PhoneGap Build.

* Instructions for using these `config.*.xml` files with Cordova CLI will be
  provided in an update.


Script Limitations
------------------
* Currently converts all plugin references to NPM\* registry references. This
  means that any plugins that were originally referenced from a git repo may
  fail. This limitation *will* be fixed in a future version.

* Does not merge the final output files (`config.{android|ios|windows}.xml`)
  into a single `config.xml` file. You must do that by hand. This limitation
  *might* be fixed in a future version.

* Has not been thoroughly tested on all versions of the Intel XDK config
  files, so there may be some unknown conversion error problems. If you find
  any issues with the scripts, please post an [issue in this GitHub repo][6]
  or leave a post in the [Intel XDK forum][5].

* Has not been thoroughly tested on later versions of Node.js. However,
  most of the script code is fairly generic, so it should work. The primary
  reason Node.js v4 or later is required is due to known limitations in the
  standard Node.js `readline` module for prior versions of Node.js.

* Requires that the Node.js script files be located in a subdirectory
  named `xdk-to-cli` that is located within the folder containing the
  master `bash` and `cmd.exe` script files.

* Requires that you start the `bash` and `cmd.exe` scripts from within the
  Intel XDK project folder containing the `intelxdk.config.*.xml` files
  to be converted.

* Only converts the Windows 10 UAP config file (`intelxdk.config.windows.xml`).
  This limitation *will not* be removed.

* The script has not been published to the NPM registry, so it is only
  available via [this GitHub repo][3].


[1]: https://software.intel.com/en-us/xdk/docs/adding-special-build-options-to-your-xdk-cordova-app-with-the-intelxdk-config-additions-xml-file
[2]: https://nodejs.org/en/download/
[3]: https://github.com/xmnboy/xdk-to-cli.git
[4]: https://github.com/xmnboy/xdk-to-cli/archive/master.zip
[5]: https://software.intel.com/en-us/forums/intel-xdk
[6]: https://github.com/xmnboy/xdk-to-cli/issues

_\*Other names and brands may be claimed as the property of others._
