FROM ubuntu:16.04

# Install dependencies.
RUN apt-get update -y && apt-get upgrade -y
RUN apt-get install -y apt-utils build-essential git vim checkinstall \
        libreadline-gplv2-dev libncursesw5-dev libssl-dev \
        libsqlite3-dev tk-dev libgdbm-dev libc6-dev libbz2-dev \
        wget apt-transport-https lsb-release ca-certificates curl \
        libzmq3-dev python net-tools

RUN python --version

# Install nodejs.
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt install -y nodejs

RUN npm install -g node-gyp
