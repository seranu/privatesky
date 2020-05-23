#!/bin/bash
set -e
this_script="$0"

if [ "$#" -ne 1 ]; then
  ${this_script} help
  exit 1
fi

for a in "$@"; do
  case $a in
    base-clean)
      echo "Building clean base..."
      pushd base
      exec docker build --no-cache -t privatesky-base:latest .
      popd
      ;;
    base)
      echo "Building base..."
      pushd base
      exec docker build --rm -t privatesky-base:latest .
      popd
      ;;
    node-clean)
      echo "Building clean privatesky..."
      pushd node 
      exec docker build --no-cache -t privatesky-node:latest .
      popd
      ;;
    node)
      echo "Building privatesky..."
      pushd node 
      exec docker build --rm -t privatesky-node:latest .
      popd
      ;;
    communication-clean)
      echo "Building communications..."
      pushd communication 
      exec docker build --no-cache -t privatesky-comms:latest .
      popd
      ;;
    communication)
      echo "Building communications..."
      pushd communication 
      exec docker build --rm -t privatesky-comms:latest .
      popd
      ;;
    all-clean)
      ${this_script} base-clean
      ${this_script} communication-clean
      ${this_script} node-clean
      ;;
    all)
      ${this_script} base
      ${this_script} communication 
      ${this_script} node 
      ;;
    help)
      echo "Usage: ${this_script} COMMAND"
      echo "  COMMANDS: base, node, communication, all, base-clean, node-clean, communication-clean, all-clean"
      echo "    base:          build base docker image with all dependencies(node, pytho, etc...)"
      echo "    node:          build privatesky docker image. Requires \"base\"." 
      echo "    communication: build communication docker image. Requires \"base\"."
      echo "    all:           build all images"
      echo "  Add \"-clean\" to build clean images(e.g. \"${this_script} base-clean\")"
      ;;
    *)
      echo "Invalid command \"$1\". Run \"${this_script} help\" for usage details"
      ;;
  esac
done
