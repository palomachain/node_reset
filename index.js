import { LCDClient } from '@palomachain/paloma.js';
import { spawn } from 'child_process';
import * as Sentry from '@sentry/node';
import * as dotenv from 'dotenv';
import http from 'http';

dotenv.config()


Sentry.init({
    dsn: "https://7fa0dfc6e0cc4e4697e58299b215c55a@o1200162.ingest.sentry.io/6380489",

    tracesSampleRate: 1.0,
});

const paloma = new LCDClient({
    URL: `${process.env.LCD_URL}`,
    chainID: process.env.CHAIN_ID,
});

let block_info = await paloma.tendermint.blockInfo();
let block_height = block_info.block.header.height;
console.log(`${process.env.LCD_URL}:`, block_height);


function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function get_local_data() {
    try {
        const child = spawn("palomad",['status']);

        child.stdout.on('data', data => {
            return JSON.parse(data);
        })

        child.stderr.on("data", (data) => {
            Sentry.captureException(`stderr: ${data}`);
        });
    } catch (err) {
        Sentry.captureException(err);
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
        Sentry.captureException(err);
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
        Sentry.captureException(err);
        return null;
    }
}

async function main() {
    console.log('checking local');
    let local_data = await get_local_data();

    if(local_data && local_data.SyncInfo) {
        if (!local_data.SyncInfo.catching_up) {
            console.log("local:", local_data.SyncInfo.latest_block_height);
            if (local_data.SyncInfo.latest_block_height + 20 < block_height) {
                try {
                    Sentry.captureMessage("RESYNC OF SERVER");

                    await server_stop();
                    await sleep(3 * 60 * 1000);
                    await server_start();
                } catch (err) {
                    Sentry.captureException(err);
                    console.log(err.stack);
                }

            }
        } else {
            console.log("system catching up");
        }
    }

    return 0;
}

await main();

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
