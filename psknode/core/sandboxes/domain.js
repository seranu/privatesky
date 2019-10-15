const path = require('path');

/**
 * These need to be first to allow customization of behavior of libraries in bundles
 * Currently PSKLogger (used inside callflow) uses this
 */
process.env.PRIVATESKY_DOMAIN_NAME = process.argv[2] || "AnonymousDomain"+process.pid;
process.env.PRIVATESKY_DOMAIN_CONSTITUTION = "../bundles/domain.js";
process.env.PRIVATESKY_TMP = process.env.PRIVATESKY_TMP || path.resolve("../tmp");
process.env.DOMAIN_WORKSPACE = path.resolve(process.env.PRIVATESKY_TMP, "domainsWorkspace", process.env.PRIVATESKY_DOMAIN_NAME);

require('../../bundles/pskruntime');
require('../../bundles/psknode');

require('psk-http-client');
const folderMQ = require("foldermq");
const fs = require('fs');
const msgpack = require('@msgpack/msgpack');
const {AgentsManager} = require('./AgentsManager');

$$.PSK_PubSub = require("soundpubsub").soundPubSub;

$$.log(`Booting domain sandbox...`);
const domain = JSON.parse(process.env.config);

if(typeof domain.constitution !== "undefined" && domain.constitution !== "undefined"){
    process.env.PRIVATESKY_DOMAIN_CONSTITUTION = domain.constitution;
}

if(typeof domain.workspace !== "undefined" && domain.workspace !== "undefined") {
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
let signatureProvider  =  blockchain.createSignatureProvider("permissive");

blockchain.createBlockchain(worldStateCache, historyStorage, consensusAlgorithm, signatureProvider, true, false);
$$.blockchain.start(()=>{
    $$.log("blockchain loaded!");
});

//loading swarm definitions
$$.log("Loading constitution file", process.env.PRIVATESKY_DOMAIN_CONSTITUTION);
// require(process.env.PRIVATESKY_DOMAIN_CONSTITUTION);

const agentsManager = new AgentsManager({
    constitutions: [
        path.resolve(`${__dirname}/../../bundles/pskruntime.js`),
        path.resolve(process.env.PRIVATESKY_DOMAIN_CONSTITUTION)
    ],
    workDir: process.env.DOMAIN_WORKSPACE
});

process.nextTick(() => { // to give time to initialize all top level variables
    for(const alias in domain.remoteInterfaces){
        if(domain.remoteInterfaces.hasOwnProperty(alias)) {
            let remoteUrl = domain.remoteInterfaces[alias];
            connectToRemote(alias, remoteUrl);
        }
    }
});


$$.event('status.domains.boot', {name: process.env.PRIVATESKY_DOMAIN_NAME});

let virtualReplyHandlerSet = false;
function connectToRemote(alias, remoteUrl){
    $$.remote.createRequestManager(1000);

    $$.log(`\n[***]Alias "${alias}" listening on ${remoteUrl} channel ${process.env.PRIVATESKY_DOMAIN_NAME}/agent/system\n`);
    $$.remote.newEndPoint(alias, `${remoteUrl}`, `${process.env.PRIVATESKY_DOMAIN_NAME}/agent/system`);

    //we need only one subscriber to send all answers back to the network...
    if(!virtualReplyHandlerSet){

        //subscribe on PubSub to catch all returning swarms and push them to network accordingly
        $$.PSK_PubSub.subscribe($$.CONSTANTS.SWARM_RETURN, (swarm) => {
            const urlRegex = new RegExp(/^(www|http:|https:)+[^\s]+[\w]/);
            if (swarm && swarm.meta && swarm.meta.target && urlRegex.test(swarm.meta.target)) {
                $$.remote.doHttpPost(swarm.meta.target, msgpack.encode(swarm), function(err, res){
                    if(err){
                        $$.error(err);
                    }
                });
            }
        }, () => true);

        virtualReplyHandlerSet = true;
    }

    $$.remote[alias].on('*', '*', function (err, res) {
        $$.PSK_PubSub.publish($$.CONSTANTS.SWARM_FOR_EXECUTION, res);
    });
}
