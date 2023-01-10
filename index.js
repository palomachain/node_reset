import { LCDClient } from '@palomachain/paloma.js';
import { spawn } from 'child_process';
import * as Sentry from '@sentry/node';

import * as dotenv from 'dotenv'
dotenv.config()


Sentry.init({
    dsn: "https://7fa0dfc6e0cc4e4697e58299b215c55a@o1200162.ingest.sentry.io/6380489",

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
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
    //const { spawn } = require('child_process')

    const child = spawn("palomad",['status']);

    try {
        for await (const data of child.stdout) {
            try {
                //console.log(data);
                //var obj = eval('(' + data + ')');
                //var json = JSON.stringify(obj);

                return JSON.parse(data);
            } catch (err) {
                console.log(data.toString());
                return null;
            }
        }
    } catch (err) {
        return null;
    }
    //return {"NodeInfo":{"protocol_version":{"p2p":"8","block":"11","app":"0"},"id":"620bad0c5c595103393e33f25ae4e7a69704d0e9","listen_addr":"tcp://0.0.0.0:26656","network":"columbus-5","version":"0.34.14","channels":"40202122233038606100","moniker":"kallisto","other":{"tx_index":"on","rpc_address":"tcp://127.0.0.1:26657"}},"SyncInfo":{"latest_block_hash":"34F6195A8825DC6473B4B25EBE36F0A6A482174B6DD0CD1285CFF7A10012236A","latest_app_hash":"B04C0D6FF38C651F61700B748D8BE99B853460CEB801C0D9F17491C9A3E32BC6","latest_block_height":"7496373","latest_block_time":"2022-05-03T20:59:12.084104379Z","earliest_block_hash":"498D9184F1A176AD5DD7E1008202C9ED81E637E2E6BCA9F65E7720EA06802D70","earliest_app_hash":"2DD07585B3D1B8D3BDF4E1666B457263DA67482B6E071AF77E673F77BD52293E","earliest_block_height":"7393372","earliest_block_time":"2022-04-25T22:37:27.978645017Z","catching_up":false},"ValidatorInfo":{"Address":"D85D978A36D257442BF16BE7F1BE2EEA06F54B46","PubKey":{"type":"tendermint/PubKeyEd25519","value":"X/e4i6h6wk5wXXoJfr6DLE1Nj0BIXnzccOyng6aZxao="},"VotingPower":"0"}}
}

async function server_stop() {
        const child = spawn("sudo",['service', 'palomad', 'stop']);

    try {
        for await (const data of child.stdout) {
        }
    } catch (err) {
        return null;
    }
}

async function server_start() {
    const child = spawn("sudo",['service', 'palomad', 'start']);

    try {
        for await (const data of child.stdout) {
        }
    } catch (err) {
        return null;
    }
}

async function main() {
    let local_data = await get_local_data();

    if(!local_data.SyncInfo.catching_up) {
        console.log("local:", local_data.SyncInfo.latest_block_height);
        if(local_data.SyncInfo.latest_block_height + 20 < block_height) {
            try {
                Sentry.captureMessage("RESYNC OF SERVER");

                console.log("system stop");
                await server_stop();
                await sleep(3 * 60 * 1000);
                await server_start();
                console.log("system start");
            } catch (err) {
                Sentry.captureException(err);
                console.log(err.stack);
            }

        }
    }
    else {
        console.log("system catching up");
    }
    console.log("*******************************");

    return 0;
}


await main();


