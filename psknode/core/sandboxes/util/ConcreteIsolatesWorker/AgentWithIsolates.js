const fs = require("fs");
const path = require("path");
const AgentStrategies = require('../AgentStrategies');
const PoolManager = require('../PoolManager');
const WorkerPool = require('../WorkerPool');


function AgentWithIsolates(constitutions, workingDir) {

    const shimsBundle = fs.readFileSync(path.join(__dirname, '../../../../bundles/sandboxBase.js'), 'utf8');
    const pskruntime = fs.readFileSync(path.join(__dirname, "../../../../bundles/pskruntime.js"), 'utf8');
    const pskNode = fs.readFileSync(path.join(__dirname, "../../../../bundles/psknode.js"), 'utf8');

    constitutions = constitutions.map(constitutionPath => {
        return fs.readFileSync(constitutionPath, 'utf8');
    });

    const workerOptions = {
        shimsBundle: shimsBundle,
        constitutions: [pskruntime, pskNode, ...constitutions]
    };

    const options = {
        workingDir,
        workerOptions
    };

    const poolManager = new PoolManager(options, AgentStrategies.ISOLATES);
    const workerPool = new WorkerPool(poolManager);

    this.executeSwarm = function(swarm, callback) {
        workerPool.addTask(swarm, callback);
    };

}



module.exports = AgentWithIsolates;
