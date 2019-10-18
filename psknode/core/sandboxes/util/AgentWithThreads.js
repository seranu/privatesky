const path = require('path');
const WorkerPool = require('./WorkerPool');


function AgentWithThreads(constitutions, workingDir) {
    const options = {
        cwd: workingDir,
        workerData: {constitutions, cwd: workingDir}
    };

    const workerPool = new WorkerPool(path.resolve(path.join(__dirname, './AgentThreadWorker.js')), options);

    this.executeSwarm = function(swarm, callback) {
        workerPool.addTask(swarm, callback);
    };
}

module.exports = AgentWithThreads;
