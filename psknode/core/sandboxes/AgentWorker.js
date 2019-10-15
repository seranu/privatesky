const {parentPort, workerData} = require('worker_threads');


if(!workerData.hasOwnProperty('constitutions')) {
    throw new Error(`Did not receive the correct configuration in worker data ${JSON.stringify(workerData)}`);
}

for (const constitution of workerData.constitutions) {
    require(constitution);
}


parentPort.on('message', (swarm) => {
    try {
        if (typeof swarm === 'string') {
            swarm = JSON.parse(swarm);
        }
    } catch (e) {
        console.error('could not parse swarm', swarm, e);
        parentPort.postMessage('error') // treat this error
    }

    console.log('got swarm', swarm);
    global.$$.swarmsInstancesManager.revive_swarm(swarm);
});


$$.PSK_PubSub.subscribe($$.CONSTANTS.SWARM_FOR_EXECUTION, function(swarm){
    // serialize swarm in the future
    delete swarm['__transmisionIndex']; // otherwise the pubSub in agentsManager will think the message was already processed
    parentPort.postMessage(swarm);
});



