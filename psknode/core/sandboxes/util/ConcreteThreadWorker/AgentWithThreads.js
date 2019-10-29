const AgentStrategies = require('../AgentStrategies');
const path = require('path');
const PoolManager = require('../PoolManager');
const SwarmPacker = require("swarmutils").SwarmPacker;
const WorkerPool = require('../WorkerPool');


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

    this.executeSwarm = function(packedSwarm, callback) {
        workerPool.addTask(packedSwarm, callback);
    };
}

module.exports = AgentWithThreads;
