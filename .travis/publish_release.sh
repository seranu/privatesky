#!/bin/sh

setup_git() {
  git config user.email "psk.build.track@gmail.com"
  git config user.name "PSK Build Tracker"
}

publish_release(){
  npm run prepare-release
  cd temp-release/psk-release
  git remote set-url origin https://${GIT_TOKEN}@github.com/privatesky/psk-release.git
  git add .
  git add -A
  git commit --message "Travis update(Build #$TRAVIS_BUILD_NUMBER)"
  git pull
  git push origin master
  cd ../.. && rm -rf temp-release
}

setup_git
publish_release