@echo off

: Assumes the xdk-to-cli app.js file is installed in a folder
: named xdk-to-cli within the directory containing this batch file.

: Copyright (c) 2017, Paul Fischer, Intel Corporation
: See LICENSE.md for license terms and conditions.


set scriptDir=
set projectDir=

echo:

IF "%~1" EQU "" (
  echo ERROR: "<project-name>.xdk file required."
  GOTO :error
)

IF /I "%~x1" NEQ ".xdk" (
  echo ERROR: "<project-name>.xdk file required."
  GOTO :error
)

IF EXIST "%~f1" (
  pushd "%~f1" >NUL 2>NUL && popd || GOTO :file
  echo ERROR: "%1 is a directory, specify the path and name of the <project-name>.xdk file."
) ELSE (
  echo ERROR: "%1 does not exist, specify the path and name of the <project-name>.xdk file."
)

:error
echo USAGE: "%~n0 path\to\file\<project-name>.xdk"
echo "Where <project-name>.xdk is located in the root of your project folder."
echo:
GOTO :end

:file
set projectDir=%~d1%~p1


: check to see if our script is actually a symbolic link
: see http://stackoverflow.com/a/24944510/2914328
dir "%~f0" | findstr "<SYMLINK>" >abc-xyz-temp.tmp
set /p scriptDir=<abc-xyz-temp.tmp
del /q abc-xyz-temp.tmp

IF "%scriptDir%" NEQ "" GOTO :symlink
set scriptDir=%~f0
GOTO :no_symlink

: if script is a symbolic link, get the real script location
: see http://stackoverflow.com/a/24944510/2914328
:symlink
set "scriptDir=%scriptDir:*[=%"
set "scriptDir=%scriptDir:]*=%"
set "scriptDir=%scriptDir:]=%"

:no_symlink
: see http://stackoverflow.com/a/37449850/2914328
FOR %%A IN ("%scriptDir%") DO (set "scriptDir=%%~dA%%~pA")


IF EXIST "%projectDir%\intelxdk.config.android.xml" (
  node "%scriptDir%\xdk-to-cli\app.js" "%~f1" <"%projectDir%\intelxdk.config.android.xml" >"%projectDir%\config.android.xml"
  echo SUCCESS: "config.android.xml file created from intelxdk.config.android.xml file."
  echo:
) ELSE (
  echo ERROR: "no intelxdk.config.android.xml file, check your project folder (%projectDir%)."
  echo:
)


IF EXIST "%projectDir%\intelxdk.config.ios.xml" (
  node "%scriptDir%\xdk-to-cli\app.js" "%~f1" <"%projectDir%\intelxdk.config.ios.xml"     >"%projectDir%\config.ios.xml"
  echo SUCCESS: "config.ios.xml file created from intelxdk.config.ios.xml file."
  echo:
) ELSE (
  echo ERROR: "no intelxdk.config.ios.xml file, check your project folder (%projectDir%)."
  echo:
)


IF EXIST "%projectDir%\intelxdk.config.windows.xml" (
  node "%scriptDir%\xdk-to-cli\app.js" "%~f1" <"%projectDir%\intelxdk.config.windows.xml" >"%projectDir%\config.windows.xml"
  echo SUCCESS: "config.windows.xml file created from intelxdk.config.windows.xml file."
  echo:
) ELSE (
  echo ERROR: "no intelxdk.config.windows.xml file, check your project folder (%projectDir%)."
  echo:
)


:end