const path = require("path");
require("../../core/utils/pingpongFork").enableLifeLine();
require(path.join(__dirname, '../../bundles/virtualMQ.js'));
require(path.join(__dirname, '../../bundles/edfsBar.js'));
require(path.join(__dirname, '../../bundles/consoleTools'));

const VirtualMQ = require('psk-webserver');
const fs = require('fs');
const sslFolder = "../../conf/ssl";

function startServer() {
    let sslConfig = undefined;
    let config = VirtualMQ.getServerConfig();
    console.log('[VirtualMQ] Using certificates from path', path.resolve(sslFolder));

    try {
        sslConfig = {
            cert: fs.readFileSync(path.join(sslFolder, 'server.cert')),
            key: fs.readFileSync(path.join(sslFolder, 'server.key'))
        };
    } catch (e) {
        console.log('[VirtualMQ] No certificates found, VirtualMQ will start using HTTP');
    }

    const listeningPort = Number.parseInt(config.port);
    const rootFolder = path.resolve(config.storage);

    const virtualMq = VirtualMQ.createVirtualMQ(listeningPort, rootFolder, sslConfig, (err) => {
        if (err) {
            console.error(err);
        }
    });
}

startServer();
