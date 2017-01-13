#!/bin/bash
# Assumes the xdk-to-cli app.js file is installed in a folder
# named xdk-to-cli within the directory containing this script.

# Copyright (c) 2017, Paul Fischer, Intel Corporation
# See LICENSE.md for license terms and conditions.

# Also assumes that your cwd is the XDK project folder that
# contains the intelxdk.config.{android|ios|windows}.xml files
# to be converted into config.{android|ios|windows}.xml files.


projectDir=$(pwd)
if [ "$(readlink $0)" = "" ]; then
  scriptDir=$(dirname $0)
else
  scriptDir=$(dirname $(readlink $0))
fi


if [ -e "intelxdk.config.android.xml" ]; then
  node ${scriptDir}/xdk-to-cli/app.js <${projectDir}/intelxdk.config.android.xml >${projectDir}/config.android.xml
  echo "SUCCESS: config.android.xml file created from intelxdk.config.android.xml file"
else
  echo "ERROR: no intelxdk.config.android.xml file, check your current working directory (pwd reports: ${projectDir})"
fi


if [ -e "intelxdk.config.ios.xml" ]; then
  node ${scriptDir}/xdk-to-cli/app.js <${projectDir}/intelxdk.config.ios.xml     >${projectDir}/config.ios.xml
  echo "SUCCESS: config.ios.xml file created from intelxdk.config.ios.xml file"
else
  echo "ERROR: no intelxdk.config.ios.xml     file, check your current working directory (pwd reports: ${projectDir})"
fi


if [ -e "intelxdk.config.windows.xml" ]; then
  node ${scriptDir}/xdk-to-cli/app.js <${projectDir}/intelxdk.config.windows.xml >${projectDir}/config.windows.xml
  echo "SUCCESS: config.windows.xml file created from intelxdk.config.windows.xml file"
else
  echo "ERROR: no intelxdk.config.windows.xml file, check your current working directory (pwd reports: ${projectDir})"
fi
