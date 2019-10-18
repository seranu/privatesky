const fs = require('fs');
const WorkerPool = require('./util/WorkerPool');
const path = require('path');

/**
 *
 * @param {[string]} constitutions
 * @param  {string} workingDir
 * @param {AgentStrategies} strategy
 * @returns {AgentWithThreads|AgentWithIsolates}
 */
function getAgent(constitutions, workingDir, strategy) {
    if (!fs.existsSync(workingDir)) {
        throw new Error(`The provided working directory does not exists ${workingDir}`);
    }

    if(!doesStrategyExists(strategy)) {
        throw new Error(`Tried creating agent with invalid strategy ${strategy}`);
    }

    if(strategy === AgentStrategies.THREADS) {
        const AgentWithThreads = require('./util/AgentWithThreads');

        return new AgentWithThreads(constitutions, workingDir);
    } else {
        const AgentWithIsolates = require('./util/AgentWithIsolates');

        return new AgentWithIsolates(constitutions, workingDir);
    }
}

function doesStrategyExists(strategy) {
    return strategy === AgentStrategies.THREADS || strategy === AgentStrategies.ISOLATES;
}


const AgentStrategies = {
    THREADS: 'threads',
    ISOLATES: 'isolates'
};

module.exports = {getAgent, AgentStrategies};
