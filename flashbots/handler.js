const { providers, Wallet, utils } = require("ethers");
const { FlashbotsBundleProvider, FlashbotsBundleResolution } = require("@flashbots/ethers-provider-bundle");
const { logger } = require("../common/logger");

// env
const PROVIDER_URL = process.env.ETHEREUM_PROVIDER_URL;
const FLASHBOTS_RELAY = process.env.FLASHBOTS_RELAY;
const FLASHBOTS_AUTH_KEY = process.env.FLASHBOTS_AUTH_KEY;
const DEFAULT_FUTURE_BLOCK_OFFSET = process.env.FLASHBOTS_DEFAULT_FUTURE_BLOCK_OFFSET;

// auth signer
const authSigner = new Wallet(FLASHBOTS_AUTH_KEY);

// ethers provider
const provider = new providers.JsonRpcProvider({ url: PROVIDER_URL });

// handler for sending txs via flashbots
async function flashbotsHandler(signedTxs, futureBlockOffset, minTimestamp, maxTimestamp) {
    if (!checkSignedTxs(signedTxs)) {
        logger.error(`invalid tx bundle: ${signedTxs}`);
        return;
    }

    futureBlockOffset = futureBlockOffset > 0 ? futureBlockOffset : DEFAULT_FUTURE_BLOCK_OFFSET;

    logger.info(`bundle txs count: ${signedTxs.length}, future block offset: ${futureBlockOffset}, min time: ${minTimestamp}, max time: ${maxTimestamp}`);

    // flashbots provider
    const flashbotsProvider = await FlashbotsBundleProvider.create(
        provider,
        authSigner,
        FLASHBOTS_RELAY
    );

    try {
        const blockNumber = await provider.getBlockNumber();
        logger.info(`block number: ${blockNumber}`);

        const simulation = await flashbotsProvider.simulate(signedTxs, blockNumber + 1, "latest", minTimestamp);
        if (simulation.error) {
            logger.error(`simulation failed, bundle hash: ${simulation.bundleHash}, err: ${simulation.error}`);
            return;
        }

        logger.info(`simulation succeeded, bundle hash: ${simulation.bundleHash}`);

        const bundlePromises = [];
        for (var i = 1; i <= futureBlockOffset; i++) {
            bundlePromises.push(flashbotsProvider.sendRawBundle(signedTxs, blockNumber + i, { minTimestamp: minTimestamp, maxTimestamp: maxTimestamp }));
        }

        const flashbotsTxs = await Promise.all(bundlePromises);
        logger.info(`bundle sent`);

        const bundleStats = await getBundleStats(simulation.bundleHash, blockNumber + 1);
        logger.info(`bundle stats: ${JSON.stringify(bundleStats)}`);

        flashbotsTxs.map(async ftx => {
            try {
                const waitResponse = await ftx.wait();
                logger.info(`${FlashbotsBundleResolution[waitResponse]}`);
            } catch (error) {
                logger.error(error);
            }
        });
    } catch (error) {
        logger.error(`error occured: ${error}`);
    }
}

// check signed txs
function checkSignedTxs(signedTxs) {
    if (!signedTxs instanceof Array) {
        return false;
    }

    return !signedTxs.some(r => !utils.isHexString(r));
}

// get the stats of the given bundle
async function getBundleStats(bundleHash, targetBlock) {
    const flashbotsProvider = await FlashbotsBundleProvider.create(
        provider,
        authSigner,
        FLASHBOTS_RELAY
    );

    return await flashbotsProvider.getBundleStats(bundleHash, targetBlock);
}

module.exports = {
    flashbotsHandler,
    getBundleStats
}
