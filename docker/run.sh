#!/bin/bash
set -e
this_script="$0"

if [ "$#" -ne 1 ]; then
  ${this_script} help
  exit 1
fi

for a in "$@"; do
  case $a in
    base)
      echo "Running base..."
      exec docker run -it privatesky-base:lastest bash
      ;;
    communication)
      echo "Running communcations..."
      exec docker run -it -p 5000:5000 -p 5001:5001 -p 8080:8080 privatesky-comms:latest bash
      ;;
    node)
      echo "Running privatesky node..."
      # TODO: remove network host paramater
      exec docker run --network host -it privatesky-node:latest bash
      ;;
    help)
      echo "Usage: ${this_script} COMMAND"
      echo "  COMMANDS: base, node, communication"
      echo "    base:          Run privatesky base docker image."
      echo "    node:          Run privatesky node docker image." 
      echo "    communication: Run communication docker image."
      ;;
    *)
      echo "Invalid command \"$1\". Run \"${this_script} help\" for usage details"
      ;;
  esac
done
