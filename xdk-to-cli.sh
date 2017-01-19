#!/bin/bash

# Assumes the xdk-to-cli app.js file is installed in a folder
# named xdk-to-cli within the directory containing this script.

# Copyright (c) 2017, Paul Fischer, Intel Corporation
# See LICENSE.md for license terms and conditions.


shopt -s nocasematch

echo

if [[ ("${1: -4}" != ".xdk") || ("${1}" == "") ]]; then
  echo ERROR: "<project-name>.xdk file required."
  echo USAGE: "$0 path/to/file/<project-name>.xdk"
  echo "Where <project-name>.xdk is located in the root of your project folder."
  echo
  exit 1
fi

if [ -d "$1" ]; then
  echo ERROR: "$1 is a directory, specify the path and name of the <project-name>.xdk file."
  echo USAGE: "$0 path/to/file/<project-name>.xdk"
  echo "Where <project-name>.xdk is located in the root of your project folder."
  echo
  exit 1
fi

if [ -f "$1" ]; then
  projectDir=$(dirname "$1")
else
  echo ERROR: "$1 does not exist or bad file, specify path and name of <project-name>.xdk file."
  echo USAGE: "$0 path/to/file/<project-name>.xdk"
  echo "Where <project-name>.xdk is located in the root of your project folder."
  echo
  exit 1
fi


# check to see if our script is the real script file or symbolic link to the script
# take "else" action if the script is a symbolic link, get the real script location
if [ "$(readlink "$0")" = "" ]; then
  scriptDir=$(dirname "$0")
else
  scriptDir=$(dirname "$(readlink "$0")")
fi


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
