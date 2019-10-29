const path = require('path');

/**
 * These need to be first to allow customization of behavior of libraries in bundles
 * Currently PSKLogger (used inside callflow) uses this
 */
process.env.PRIVATESKY_DOMAIN_NAME = process.argv[2] || "AnonymousDomain" + process.pid;
process.env.PRIVATESKY_DOMAIN_CONSTITUTION = "../bundles/domain.js";
process.env.PRIVATESKY_TMP = process.env.PRIVATESKY_TMP || path.resolve("../tmp");
process.env.DOMAIN_WORKSPACE = path.resolve(process.env.PRIVATESKY_TMP, "domainsWorkspace", process.env.PRIVATESKY_DOMAIN_NAME);
process.env.vmq_zeromq_sub_address = 'tcp://127.0.0.1:5000';
const signatureHeaderName = process.env.vmq_signature_header_name || "x-signature";

require('../../bundles/pskruntime');
require('../../bundles/psknode');

require('psk-http-client');
const folderMQ = require("foldermq");
const fs = require('fs');
const msgpack = require('@msgpack/msgpack');
const http = require('http');
const swarmUtils = require("swarmutils");
const SwarmPacker = swarmUtils.SwarmPacker;
const OwM = swarmUtils.OwM;
const {ManagerForAgents} = require('./ManagerForAgents');

$$.PSK_PubSub = require("soundpubsub").soundPubSub;

$$.log(`Booting domain sandbox... ${process.env.PRIVATESKY_DOMAIN_NAME}`);
const domain = JSON.parse(process.env.config);

if (typeof domain.constitution !== "undefined" && domain.constitution !== "undefined") {
    process.env.PRIVATESKY_DOMAIN_CONSTITUTION = domain.constitution;
}

if (typeof domain.workspace !== "undefined" && domain.workspace !== "undefined") {
    process.env.DOMAIN_WORKSPACE = domain.workspace;
}

//enabling blockchain from confDir
//validate path exists
const confDir = path.resolve(process.env.DOMAIN_WORKSPACE);

$$.log("Using workspace", confDir);
let blockchain = require("blockchain");

let worldStateCache = blockchain.createWorldStateCache("fs", confDir);
let historyStorage = blockchain.createHistoryStorage("fs", confDir);
let consensusAlgorithm = blockchain.createConsensusAlgorithm("direct");
let signatureProvider = blockchain.createSignatureProvider("permissive");

blockchain.createBlockchain(worldStateCache, historyStorage, consensusAlgorithm, signatureProvider, true, false);
$$.blockchain.start(() => {
    $$.log("blockchain loaded!");
});


$$.log("Agents will be using constitution file", process.env.PRIVATESKY_DOMAIN_CONSTITUTION);

new ManagerForAgents({
    constitutions: [
        path.resolve(`${__dirname}/../../bundles/pskruntime.js`),
        path.resolve(process.env.PRIVATESKY_DOMAIN_CONSTITUTION)
    ],
    workDir: process.env.DOMAIN_WORKSPACE
});

process.nextTick(() => { // to give time to initialize all top level variables
    for (const alias in domain.remoteInterfaces) {
        if (domain.remoteInterfaces.hasOwnProperty(alias)) {
            let remoteUrl = domain.remoteInterfaces[alias];
            connectToRemote(alias, remoteUrl);
        }
    }

    setTimeout(() => {
        for (let alias in domain.localInterfaces) {
            if (domain.localInterfaces.hasOwnProperty(alias)) {

                let path = domain.localInterfaces[alias];
                connectLocally(alias, path);
            }
        }
    }, 100);
});


$$.event('status.domains.boot', {name: process.env.PRIVATESKY_DOMAIN_NAME});

let virtualReplyHandlerSet = false;

function connectToRemote(alias, remoteUrl) {
    $$.remote.createRequestManager(1000);
    const listeningChannel = $$.remote.base64Encode(process.env.PRIVATESKY_DOMAIN_NAME);

    $$.log(`\n[***]Alias "${alias}" listening on ${remoteUrl} channel ${listeningChannel}\n`);

    const request = new RequestFactory(remoteUrl);

    request.createForwardChannel(listeningChannel, 'demo-public-key', (res) => {
        if (res.statusCode >= 400) {
            console.error('error creating channel', res.statusCode);
            // throw err;
            return;
        }

        request.receiveMessageFromZMQ(listeningChannel, 'someSignature', () => {
        }, (channel, message) => {
            $$.PSK_PubSub.publish($$.CONSTANTS.SWARM_FOR_EXECUTION, message);
        })
    });

    //we need only one subscriber to send all answers back to the network...
    if (!virtualReplyHandlerSet) {

        //subscribe on PubSub to catch all returning swarms and push them to network accordingly
        $$.PSK_PubSub.subscribe($$.CONSTANTS.SWARM_RETURN, (packedSwarm) => {
            const swarmHeader = SwarmPacker.getHeader(packedSwarm);

            const urlRegex = new RegExp(/^(www|http:|https:)+[^\s]+[\w]/);
            if (urlRegex.test(swarmHeader.swarmTarget)) {
                $$.remote.doHttpPost(swarmHeader.swarmTarget, packedSwarm, function (err, res) {
                    if (err) {
                        $$.error(err);
                    }
                });
            }
        }, () => true);

        virtualReplyHandlerSet = true;
    }

}

let localReplyHandlerSet = false;
const queues = {};

function connectLocally(alias, path2folder) {
    if (!queues[alias]) {
        path2folder = path.resolve(path2folder);
        fs.mkdir(path2folder, {recursive: true}, (err, res) => {
            const queue = folderMQ.createQue(path2folder, (err, res) => {
                if (!err) {
                    console.log(`\n[***]Alias <${alias}> listening local on ${path2folder}\n`);
                }
            });
            queue.registerConsumer((err, swarm) => {
                if (!err) {
                    $$.PSK_PubSub.publish($$.CONSTANTS.SWARM_FOR_EXECUTION, SwarmPacker.pack(OwM.prototype.convert(swarm)));
                }
            });
            queues[alias] = queue;
        });
    } else {
        console.log(`Alias ${alias} has already a local queue attached.`);
    }

    if (!localReplyHandlerSet) {
        $$.PSK_PubSub.subscribe($$.CONSTANTS.SWARM_RETURN, (packedSwarm) => {
            const swarmHeader = SwarmPacker.getHeader(packedSwarm);

            const urlRegex = new RegExp(/^(www|http:|https:)+[^\s]+[\w]/);
            if (!urlRegex.test(swarmHeader.swarmTarget)) {
                const q = folderMQ.createQue(swarmHeader.swarmTarget, (err, res) => {
                    if (!err) {
                        const swarm = SwarmPacker.unpack(packedSwarm);
                        q.getHandler().sendSwarmForExecution(swarm)
                    } else {
                        console.log(`Unable to send to folder ${swarmHeader.swarmTarget} swarm with id $swarm.meta.id`);
                    }
                });
            }
        }, () => true);
        localReplyHandlerSet = true;
    }
}


function RequestFactory(url) {
    this.createForwardChannel = function (channelName, publicKey, callback) {
        const options = {
            path: `/create-channel/${channelName}`,
            method: "PUT"
        };

        const req = http.request(url, options, (res) => {
            this.enableForward(channelName, "justASignature", callback);
        });
        req.write(publicKey);
        req.end();
    };

    this.enableForward = function (channelName, signature, callback) {
        const options = {
            path: `/forward-zeromq/${channelName}`,
            method: "POST"
        };

        const req = http.request(url, options, callback);
        req.setHeader(signatureHeaderName, signature);
        req.end();
    };

    this.receiveMessageFromZMQ = function (channelName, signature, readyCallback, receivedCallback) {
        const zmqIntegration = require("zmq_adapter");

        let catchEvents = (eventType, ...args) => {
            // console.log("Event type caught", eventType, ...args);
            if (eventType === "connect") {
                //connected so all good
                readyCallback();
            }
        };

        let consumer = zmqIntegration.createZeromqConsumer(process.env.vmq_zeromq_sub_address, catchEvents);
        consumer.subscribe(channelName, signature, (channel, receivedMessage) => {
            receivedCallback(JSON.parse(channel.toString()).channelName, receivedMessage.buffer);
        });
    }
}
