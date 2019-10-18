const {Agent} = require('./Agent');
const OwM = require('swarmutils').OwM;


function AgentsManager({constitutions, workDir}) {
    if (!this instanceof AgentsManager) {
        throw new TypeError('Calling this constructor without new is forbidden');
    }

    const generalAgent = new Agent(constitutions, workDir, 'threads');
    $$.PSK_PubSub.subscribe($$.CONSTANTS.SWARM_FOR_EXECUTION, executeSwarm, filterSwarmsExecutionRequests);

    function isOwnAgent(agent) {
        return true;
    }

    function executeSwarm(swarm) {
        $$.log("Executing in sandbox towards: ", swarm.meta.target);

        generalAgent.executeSwarm(swarm, (err, newSwarm) => {
            if (err) {
                $$.error('error executing in worker pool', err);
                // do something
                return;
            }

            newSwarm = new OwM(newSwarm);

            if (newSwarm.getMeta('command') === 'executeSwarmPhase') {
                $$.PSK_PubSub.publish($$.CONSTANTS.SWARM_FOR_EXECUTION, newSwarm);
            } else {
                $$.PSK_PubSub.publish($$.CONSTANTS.SWARM_RETURN, newSwarm);
            }
        });

    }

    function filterSwarmsExecutionRequests(swarm) {
        swarm = new OwM(swarm);

        if (!isOwnAgent(swarm.getMeta('target'))) {
            $$.error(`Received swarm for an agent ${swarm.getMeta('target')} that does not exist in domain ${process.env.PRIVATESKY_DOMAIN_NAME}`);
            return false;
        }

        if (swarm.getMeta('command') !== 'executeSwarmPhase') {
            $$.error(`Received swarm with wrong command ${swarm.getMeta('command')}`);
            return false;
        }

        return true;
    }

}

module.exports = {AgentsManager};
