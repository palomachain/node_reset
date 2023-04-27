# Paloma.js Server Checker

This is a Node.js script that periodically checks the status of a Paloma.js server and restarts it if necessary. The script uses the Paloma.js library to connect to the server and the `child_process` module to start and stop the server.

## Dependencies

This script requires the following dependencies:

- `@palomachain/paloma.js`: Paloma.js library for connecting to the server
- `child_process`: module for starting and stopping the server
- `@sentry/node`: optional dependency for error logging and monitoring
- `dotenv`: optional dependency for loading environment variables from a `.env` file
- `http`: optional dependency for starting a local web server

## Configuration

The script reads configuration from environment variables:

- `SENTRY`: Sentry DSN for error logging and monitoring
- `PALOMA_RPC_ENDPOINT`: Paloma.js RPC endpoint for connecting to the server

These variables can be set in a `.env` file in the root directory of the project.

## Usage

To use this script, follow these steps:

1. Install dependencies using `npm install`.
2. Set the `SENTRY` and `PALOMA_RPC_ENDPOINT` environment variables.
3. Run the script using `npm start`.

The script will start a local web server on port 3000 and periodically check the status of the Paloma.js server. If the server is not synced with the latest block height, the script will stop and restart the server after a 3 minute delay. The script also logs errors and exceptions to Sentry if the `SENTRY` environment variable is set.
