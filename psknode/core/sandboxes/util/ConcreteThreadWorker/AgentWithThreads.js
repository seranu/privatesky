const AgentStrategies = require('../AgentStrategies');
const path = require('path');
const WorkerPool = require('../WorkerPool');
const PoolManager = require('../PoolManager');


function AgentWithThreads(constitutions, workingDir) {
    const workerOptions = {
        cwd: workingDir,
        workerData: {constitutions, cwd: workingDir}
    };

    const poolOptions = {
        fileName: path.resolve(path.join(__dirname, './AgentThreadWorker.js')),
        workerOptions: workerOptions
    };

    const poolManager = new PoolManager(poolOptions, AgentStrategies.THREADS);
    const workerPool = new WorkerPool(poolManager);

    this.executeSwarm = function(swarm, callback) {
        workerPool.addTask(swarm, callback);
    };
}

module.exports = AgentWithThreads;
