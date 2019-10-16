const fs = require('fs');
const WorkerPool = require('./util/WorkerPool');
const path = require('path');

/**
 *
 * @param {[string]} constitutions
 * @param  {string} workingDir
 * @param {'threads'|'isolates'} strategy
 * @constructor
 */
function Agent(constitutions, workingDir, strategy) {
    if (!fs.existsSync(workingDir)) {
        throw new Error(`The provided working directory does not exists ${workingDir}`);
    }

    const options = {
        cwd: workingDir,
        workerData: {constitutions, cwd: workingDir}
    };

    const workerPool = new WorkerPool(path.resolve(path.join(__dirname, './AgentWorker.js')), options);


    this.executeSwarm = function(swarm, callback) {
        workerPool.addTask(swarm, callback);
    };

}

module.exports = {Agent};
