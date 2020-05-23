FROM privatesky-base:latest

ENV TARGET_FOLDER_NAME="/app/psk-node"
RUN git clone https://github.com/PrivateSky/privatesky.git $TARGET_FOLDER_NAME

RUN cd $TARGET_FOLDER_NAME && \
    npm install --unsafe-perm && \
    npm run postinstall --unsafe-perm && \
    npm run build
    
#RUN cd $TARGET_FOLDER_NAME && \
#    rm -rf conf && \
#    cd bin/scripts && \
#    sed -i 's/127.0.0.1/localhost/g' generateConfig.js && \
#    node generateConfig.js
#
#RUN cd $TARGET_FOLDER_NAME && echo 'node ./psknode/core/launcher.js' >> startup-script.sh
#RUN cd $TARGET_FOLDER_NAME && cat startup-script.sh
#
#CMD cd $TARGET_FOLDER_NAME && \
#    bash startup-script.sh
