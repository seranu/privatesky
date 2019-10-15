const {Agent} = require('./Agent');


function AgentsManager({constitutions, workDir}) {
    if(!this instanceof AgentsManager) {
        throw new TypeError('Calling this constructor without new is forbidden');
    }

    const generalAgent = new Agent(constitutions, workDir, 'threads');
    $$.PSK_PubSub.subscribe($$.CONSTANTS.SWARM_FOR_EXECUTION, executeSwarm);

    function isOwnAgent(agent) {
        return true;
    }

    function executeSwarm(swarm) {
        $$.log("Executing in sandbox towards: ", swarm.meta.target);

        if(isOwnAgent(swarm.meta.target)) {
            generalAgent.executeSwarm(swarm, (err, newSwarm) => {
                if(err) {
                    $$.error('error executing in worker pool', err);
                    // do something
                    return;
                }

                $$.PSK_PubSub.publish($$.CONSTANTS.SWARM_RETURN, newSwarm);
            });
        } else {
            $$.log('Is not own agent');
            $$.PSK_PubSub.publish($$.CONSTANTS.SWARM_RETURN, swarm);
        }

    }

    this.executeSwarm = executeSwarm
}

module.exports = {AgentsManager};
