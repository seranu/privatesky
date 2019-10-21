const AgentStrategies = require('./AgentStrategies');
const fs = require('fs');
const os = require('os');
const util = require('util');
const {EventEmitter} = require('events');
const {Worker} = require('worker_threads');

function PoolManager(workerFilePath, workerOptions, agentStrategy, numberOfWorkers = os.cpus().length) {
    EventEmitter.call(this);

    if (!fs.existsSync(workerFilePath)) {
        throw new Error(`Path to worker script does not exists ${workerFilePath}`);
    }

    let pool = [];

    /** @returns {Worker|null} */
    this.getAvailableWorker = function () {
        // find first free worker
        const freeWorkerIndex = pool.findIndex(el => !el.isWorking);

        let worker = null;

        // if no free worker is available, try creating one
        if (freeWorkerIndex === -1) {
            createNewWorker();
        } else {
            worker = pool[freeWorkerIndex];
        }

        if (worker === null) {
            return null;
        }

        // if free worker exists, set its state to working
        worker.isWorking = true;
        return worker.worker;
    };

    /** @param {Worker} worker */
    this.returnWorker = function (worker) {
        // find worker that matches one in the pool
        const freeWorkerIndex = pool.findIndex(el => el.worker === worker);

        if (freeWorkerIndex === -1) {
            console.error('Tried to return a worker that is not owned by the pool');
            return;
        }

        // if worker is found, set its state to not working
        pool[freeWorkerIndex].isWorking = false;
        this.emit('freedWorker');
    };

    /** @param {Worker} worker */
    this.removeWorker = function (worker) {
        pool = pool.filter(poolWorker => poolWorker.worker === worker);
    };


    function createNewWorker() {
        if(agentStrategy === AgentStrategies.THREADS) {
            createThreadsWorker();
        } else if(agentStrategy === AgentStrategies.ISOLATES) {
            createIsolatesWorker();
        } else {
            $$.error(`Unknown strategy ${agentStrategy}`);
        }
    }

    const createThreadsWorker = () => {
        if (pool.length >= numberOfWorkers) {
            return null;
        }

        const worker = new Worker(workerFilePath, workerOptions);

        const workerObj = {
            isWorking: false,
            worker: worker
        };

        pool.push(workerObj);

        // delay this, otherwise is synchronous and tasks will be delayed too much
        setImmediate(() => {
            this.emit('freedWorker');
        });
    };

    const createIsolatesWorker = () => {}


}

util.inherits(PoolManager, EventEmitter);

module.exports = {
    PoolManager
};
