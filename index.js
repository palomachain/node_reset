import { LCDClient } from '@palomachain/paloma.js';
import { spawn } from 'child_process';
import * as Sentry from '@sentry/node';
import * as dotenv from 'dotenv';
import http from 'http';

dotenv.config()

let use_sentry = false;
let block_height = 0;

if(process.env.SENTRY) {
    Sentry.init({
        dsn: process.env.SENTRY,

        tracesSampleRate: 1.0,
    });

    use_sentry = true;
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function captureException(exception) {
    if(use_sentry) { Sentry.captureException(exception); }
}

function captureMessage(message) {
    if(use_sentry) { Sentry.captureMessage(message); }
}

async function get_local_data() {
    try {
        const child = spawn("palomad",['status']);

        for await (const data of child.stdout) {
            return JSON.parse(data);
        };

        for await (const data of child.stderr) {
            captureException(`CHECK IS SERVER IS UP: ${data}`);
        };
    } catch (err) {
        captureException(err);
        return null;
    }
}

async function server_stop() {
    console.log("server stop");
    const child = spawn("sudo",['service', 'palomad', 'stop']);

    try {
        for await (const data of child.stdout) {
            console.log(data);
        }
    } catch (err) {
        captureException(err);
        return null;
    }
}

async function server_start() {
    console.log("server start");
    const child = spawn("sudo",['service', 'palomad', 'start']);

    try {
        for await (const data of child.stdout) {
            console.log(data);
        }
    } catch (err) {
        captureException(err);
        return null;
    }
}

async function get_start_height() {
    let local_data = await get_local_data();
    block_height = local_data.SyncInfo.latest_block_height;
   console.log("initial:",  block_height);
}

async function check_and_sync(local_data) {
    try {
        console.log("last:", block_height);
        console.log("current:", local_data.SyncInfo.latest_block_height);

        if (local_data.SyncInfo.latest_block_height === block_height) {
            try {
                captureMessage("RESYNC OF SERVER");

                await server_stop();
                await sleep(3 * 60 * 1000);
                await server_start();
            } catch (err) {
                captureException(err);
                console.log(err.stack);
            }

        } else {
            block_height = local_data.SyncInfo.latest_block_height;
        }
    } catch (err) {}
}

async function main() {
    console.log('checking local');
    let local_data = await get_local_data();

    await check_and_sync(local_data);

    return 0;
}

setTimeout(get_start_height, 2000);
setInterval(main, 80000);

// setInterval(main, 1000 * 60 * 5);
//
// const requestListener = function (req, res) {
//     try {
//         res.setHeader('Content-Type', 'application/json');
//         res.writeHead(200);
//
//         //res.end(JSON.stringify(stats));
//     } catch (error) {
//         console.log(error);
//     }
// }
//
// const server = http.createServer(requestListener);
// server.listen(process.env.PORT);
