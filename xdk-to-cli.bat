@echo off
: Assumes the xdk-to-cli app.js file is installed in a folder
: named xdk-to-cli within the directory containing this batch file.

: Also assumes that your cwd is the XDK project folder that
: contains the intelxdk.config.{android|ios|windows}.xml files
: to be converted into config.{android|ios|windows}.xml files.

set scriptDir=
set projectDir=%CD%

:see http://stackoverflow.com/a/24944510/2914328
dir %~f0 | findstr "<SYMLINK>" >abc-xyz-temp.tmp
set /p scriptDir=<abc-xyz-temp.tmp
del /q abc-xyz-temp.tmp

IF "%scriptDir%" NEQ "" GOTO :symlink
set scriptDir=%~f0
GOTO :no_symlink

:symlink
set "scriptDir=%scriptDir:*[=%"
set "scriptDir=%scriptDir:]*=%"
set "scriptDir=%scriptDir:]=%"

:no_symlink
:see http://stackoverflow.com/a/37449850/2914328
FOR %%A IN ("%scriptDir%") DO (set "scriptDir=%%~dA%%~pA")


IF EXIST intelxdk.config.android.xml (
  node %scriptDir%\xdk-to-cli\app.js <%projectDir%\intelxdk.config.android.xml >%projectDir%\config.android.xml
  echo "SUCCESS: config.android.xml file created from intelxdk.config.android.xml file"
) ELSE (
  echo The file was not found.
)


IF EXIST intelxdk.config.ios.xml (
  node %scriptDir%\xdk-to-cli\app.js <%projectDir%\intelxdk.config.ios.xml     >%projectDir%\config.ios.xml
  echo "SUCCESS: config.ios.xml file created from intelxdk.config.ios.xml file"
) ELSE (
  echo "ERROR: no intelxdk.config.ios.xml     file, check your current working directory (cd reports: %projectDir%)"
)


IF EXIST intelxdk.config.windows.xml (
  node %scriptDir%\xdk-to-cli\app.js <%projectDir%\intelxdk.config.windows.xml >%projectDir%\config.windows.xml
  echo "SUCCESS: config.windows.xml file created from intelxdk.config.windows.xml file"
) ELSE (
  echo "ERROR: no intelxdk.config.windows.xml file, check your current working directory (cd reports: %projectDir%)"
)
