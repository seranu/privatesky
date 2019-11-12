const AgentStrategies = require('./util/AgentStrategies');
const fs = require('fs');

/**
 *
 * @param {AgentConfig&AgentConfigStorage} config
 * @returns {AgentWithThreads|AgentWithIsolates}
 */
function getAgent(config) {
    if (!fs.existsSync(config.workingDir)) {
        throw new Error(`The provided working directory does not exists ${config.workingDir}`);
    }

    if(!doesStrategyExists(config.workerStrategy)) {
        throw new Error(`Tried creating agent with invalid strategy ${config.workerStrategy}`);
    }

    if(config.workerStrategy === AgentStrategies.THREADS) {
        const AgentWithThreads = require('./util/ConcreteThreadWorker/AgentWithThreads');

        return new AgentWithThreads(config);
    } else {
        const AgentWithIsolates = require('./util/ConcreteIsolatesWorker/AgentWithIsolates');

        return new AgentWithIsolates(config);
    }
}

function doesStrategyExists(strategy) {
    return strategy === AgentStrategies.THREADS || strategy === AgentStrategies.ISOLATES;
}



module.exports = {getAgent};
