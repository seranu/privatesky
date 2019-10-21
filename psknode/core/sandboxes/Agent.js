const AgentStrategies = require('./util/AgentStrategies');
const fs = require('fs');

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
        const AgentWithThreads = require('./util/ConcreteThreadWorker/AgentWithThreads');

        return new AgentWithThreads(constitutions, workingDir);
    } else {
        const AgentWithIsolates = require('./util/ConcreteIsolatesWorker/AgentWithIsolates');

        return new AgentWithIsolates(constitutions, workingDir);
    }
}

function doesStrategyExists(strategy) {
    return strategy === AgentStrategies.THREADS || strategy === AgentStrategies.ISOLATES;
}



module.exports = {getAgent};
