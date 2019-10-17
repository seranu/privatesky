const {parentPort, workerData} = require('worker_threads');

if (!workerData.hasOwnProperty('constitutions')) {
    throw new Error(`Did not receive the correct configuration in worker data ${JSON.stringify(workerData)}`);
}

for (const constitution of workerData.constitutions) {
    require(constitution);
}


const beesHealer = require('swarmutils').beesHealer;

parentPort.on('message', (swarm) => {
    try {
        // needed when domain won't have to deserialize the swarm
        if (typeof swarm === 'string') {
            swarm = JSON.parse(swarm);
        }
    } catch (e) {
        parentPort.postMessage(e) // treat this error
    }

    global.$$.swarmsInstancesManager.revive_swarm(swarm);
});


$$.PSK_PubSub.subscribe($$.CONSTANTS.SWARM_FOR_EXECUTION, function (swarm) {
    const newSwarm = beesHealer.asJSON(swarm, swarm.getMeta('phaseName'), swarm.getMeta('args'));

    parentPort.postMessage(newSwarm);
});



