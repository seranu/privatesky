/*
  Rebuild sources
  Start A Virtual MQ
  Start a Launcher
 */

const path = require('path');
const max_timeout = 10*60*1000; // 10 minutes
const restartDelays = {};

const pingFork = require("../../core/utils/pingpongFork").fork;

let shouldRestart = true;
const forkedProcesses = {};


function startProcess(filePath) {
    console.log("Booting", filePath);
    forkedProcesses[filePath] = pingFork(filePath);

    console.log('SPAWNED ', forkedProcesses[filePath].pid);

    function restartWithDelay(filePath){
        let timeout = restartDelays[filePath] || 100;
        console.log(`Process will restart in ${timeout} ms ...`);
        setTimeout(()=>{
            restartDelays[filePath] = (timeout * 2) % max_timeout;
            startProcess(filePath);
        }, timeout);
    }

    function errorHandler(filePath) {
        let timeout = 100;
        return function (error) {
            console.log(`\x1b[31mException caught on spawning file ${filePath} `, error ? error : "", "\x1b[0m"); //last string is to reset terminal colours
            if (shouldRestart) {
                restartWithDelay(filePath);
            }
        }
    }

    function exitHandler(filePath) {
        return function () {
            console.log(`\x1b[33mExit caught on spawned file ${filePath}`, "\x1b[0m"); //last string is to reset terminal colours
            if (shouldRestart) {
                restartWithDelay(filePath);
            }
        }
    }

    forkedProcesses[filePath].on('error', errorHandler(filePath));
    forkedProcesses[filePath].on('exit', exitHandler(filePath));
}

startProcess(path.join(__dirname, '../../core/launcher.js'));
startProcess(path.join(__dirname, 'virtualMq.js'));