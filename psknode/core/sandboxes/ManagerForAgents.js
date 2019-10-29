const AgentStrategies = require('./util/AgentStrategies');
const SwarmPacker = require("swarmutils").SwarmPacker;
const {getAgent} = require('./Agent');


function ManagerForAgents({constitutions, workDir}) {

    // TODO: add capability to initialize more agents
    const generalAgent = getAgent(constitutions, workDir, AgentStrategies.THREADS);
    $$.PSK_PubSub.subscribe($$.CONSTANTS.SWARM_FOR_EXECUTION, executeSwarm, filterSwarmsExecutionRequests);

    function isOwnAgent(agent) {
        return true;
    }

    function executeSwarm(packedSwarm) {
        const messageHeader = SwarmPacker.getHeader(packedSwarm);

        $$.info("Executing in sandbox towards: ", messageHeader.swarmTarget);

        generalAgent.executeSwarm(packedSwarm, (err, newSwarm) => {
            if (err) {
                $$.error('error executing in worker pool', err);
                // do something
                return;
            }

            const responseMessageHeader = SwarmPacker.getHeader(newSwarm);

            if (responseMessageHeader.command === 'executeSwarmPhase') {
                $$.PSK_PubSub.publish($$.CONSTANTS.SWARM_FOR_EXECUTION, newSwarm);
            } else {
                $$.PSK_PubSub.publish($$.CONSTANTS.SWARM_RETURN, newSwarm);
            }
        });

    }

    function filterSwarmsExecutionRequests(packedSwarm) {
        const messageHeader = SwarmPacker.getHeader(packedSwarm);

        if (!isOwnAgent(messageHeader.swarmTarget)) {
            $$.error(`Received swarm for an agent ${packedSwarm.getMeta('target')} that does not exist in domain ${process.env.PRIVATESKY_DOMAIN_NAME}`);
            return false;
        }

        if (messageHeader.command !== 'executeSwarmPhase') {
            $$.error(`Received swarm with wrong command ${swarm.getMeta('command')}`);
            return false;
        }

        return true;
    }

}

module.exports = {ManagerForAgents};
