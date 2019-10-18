const {EventEmitter} = require('events');
const fs = require('fs');
const os = require('os');
const util = require('util');
const Queue = require('swarmutils').Queue;
const {Worker} = require('worker_threads');


function WorkerPool(workerFilePath, workerOptions, numberOfWorkers = os.cpus().length) {
    if (!fs.existsSync(workerFilePath)) {
        throw new Error(`Path to worker script does not exists ${workerFilePath}`);
    }

    const poolManager = new PoolManager(workerFilePath, workerOptions, numberOfWorkers);
    const taskQueue = new Queue();

    this.addTask = function (task, callback) {
        const worker = poolManager.getAvailableWorker();

        if (!worker) {
            taskQueue.push({task, callback});
            return false;
        }

        addWorkerListeners(worker, callback);

        worker.postMessage(task);
        return true;
    };

    poolManager.on('freedWorker', () => {
        if(taskQueue.isEmpty()) {
           return;
        }

        const nextTask = taskQueue.front();

        const taskWasAcceptedByAWorker = this.addTask(nextTask.task, nextTask.callback);

        if (taskWasAcceptedByAWorker) {
            taskQueue.pop();
        }
    });

    /**
     * @param {Worker} worker
     * @param {function} callbackForListeners
     */
    function addWorkerListeners(worker, callbackForListeners) {

        function callbackWrapper(...args) {
            callbackForListeners(...args);
            removeListeners();
            poolManager.returnWorker(worker);
        }

        function onMessage(...args) {
            if (args[0] instanceof Error) {
                callbackWrapper(...args);
            } else {
                callbackWrapper(undefined, ...args);
            }
        }

        function onError(err) {
            poolManager.removeWorker(worker);
            callbackWrapper(err);
        }

        function onExit(code) {
            poolManager.removeWorker(worker);
            if (code !== 0) {
                callbackWrapper(new Error('Operation could not be successfully executed'));
            }
        }

        worker.once('message', onMessage);
        worker.once('error', onError);
        worker.once('exit', onExit);

        function removeListeners() {
            worker.removeListener('message', onMessage);
            worker.removeListener('error', onError);
            worker.removeListener('exit', onExit);
        }
    }
}


function PoolManager(workerFilePath, workerOptions, numberOfWorkers) {
    EventEmitter.call(this);

    let pool = [];

    /** @returns {Worker|null} */
    this.getAvailableWorker = function () {
        // find first free worker
        const freeWorkerIndex = pool.findIndex(el => !el.isWorking);

        let worker = null;

        // if no free worker is available, try creating one
        if (freeWorkerIndex === -1) {
            worker = createNewWorker();
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
        if (pool.length >= numberOfWorkers) {
            return null;
        }

        const worker = new Worker(workerFilePath, workerOptions);

        const workerObj = {
            isWorking: false,
            worker: worker
        };

        pool.push(workerObj);

        return workerObj;
    }
}

util.inherits(PoolManager, EventEmitter);

module.exports = WorkerPool;
