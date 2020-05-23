FROM privatesky-base:latest
ENV TARGET_DIRECTORY="/app/psk-communication"

RUN mkdir -p $TARGET_DIRECTORY 
RUN git clone https://github.com/PrivateSky/privatesky.git $TARGET_DIRECTORY

RUN cd $TARGET_DIRECTORY && npm install --unsafe-perm
RUN cd $TARGET_DIRECTORY && npm run postinstall --unsafe-perm
RUN cd $TARGET_DIRECTORY && npm run build

COPY psk-webserver /etc/init.d
COPY zeromq-proxy /etc/init.d
COPY start-zeromq.sh $TARGET_DIRECTORY
COPY start-pskwebserver.sh $TARGET_DIRECTORY

RUN cd $TARGET_DIRECTORY && chmod +x start-zeromq.sh && \
      chmod +x start-pskwebserver.sh

RUN cd /etc/init.d && chmod +x zeromq-proxy && \
      chmod +x psk-webserver && \
      update-rc.d zeromq-proxy defaults && \
      update-rc.d psk-webserver defaults

EXPOSE 8080/tcp 5000/tcp 5001/tcp

ENTRYPOINT service zeromq-proxy start && service psk-webserver start && bash
