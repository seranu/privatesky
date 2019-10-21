const beesHealer = require('swarmutils').beesHealer;
const IsolatedVM = require('../../../../../modules/pskisolates');
const path = require('path');
const util = require('util');
const {EventEmitter} = require('events');

async function getAgentIsolatesWorker({shimsBundle, constitutions}, workingDir) {

    const config = IsolatedVM.IsolateConfig.defaultConfig;
    config.logger = {
        send([logChannel, logObject]) {
            $$.redirectLog(logChannel, logObject)
        }
    };

    const isolate = await IsolatedVM.getDefaultIsolate({
        shimsBundle: shimsBundle,
        browserifyBundles: constitutions,
        config: config
    });

    isolate.globalSetSync('returnSwarm', function (swarm) {
        this.emit('message', swarm);
    });

    await isolate.run(`
            require("callflow").swarmInstanceManager;
            const beesHealer = require('swarmutils').beesHealer;
        
            global.$$.PSK_PubSub.subscribe($$.CONSTANTS.SWARM_FOR_EXECUTION, function(swarm){
                console.log("returning");
               
                returnSwarm.apply(undefined, [beesHealer.asJSON(swarm)]);
            });
		`);

    setInterval(async () => {
        const rawIsolate = isolate.rawIsolate;
        const cpuTime = rawIsolate.cpuTime;
        const wallTime = rawIsolate.wallTime;

        const heapStatistics = await rawIsolate.getHeapStatistics();
        const activeCPUTime = (cpuTime[0] + cpuTime[1] / 1e9) * 1000;
        const totalCPUTime = (wallTime[0] + wallTime[1] / 1e9) * 1000;
        const idleCPUTime = totalCPUTime - activeCPUTime;
        $$.event('sandbox.metrics', {heapStatistics, activeCPUTime, totalCPUTime, idleCPUTime});

    }, 10 * 1000); // 10 seconds

    function IsolatesWrapper() {
        EventEmitter.call(this);

        this.postMessage = function(swarm) {
            isolate.run(`
				global.$$.swarmsInstancesManager.revive_swarm(JSON.parse('${beesHealer.asJSON(swarm)}'));
			`).catch((err) => {
                this.emit('error', err);
            });
        }
    }

    util.inherits(IsolatesWrapper, EventEmitter);

    return new IsolatesWrapper();
}


module.exports = getAgentIsolatesWorker;
