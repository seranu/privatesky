const AgentStrategies = require('../AgentStrategies');
const path = require('path');
const WorkerPool = require('../WorkerPool');
const {PoolManager} = require('../PoolManager');


function AgentWithThreads(constitutions, workingDir) {
    const options = {
        cwd: workingDir,
        workerData: {constitutions, cwd: workingDir}
    };

    const poolManager = new PoolManager(path.resolve(path.join(__dirname, './AgentThreadWorker.js')), options, AgentStrategies.THREADS);
    const workerPool = new WorkerPool(poolManager);

    this.executeSwarm = function(swarm, callback) {
        workerPool.addTask(swarm, callback);
    };
}

module.exports = AgentWithThreads;
