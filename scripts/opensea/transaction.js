const { providers, Wallet, utils ,BigNumber} = require("ethers");
const { flashbotsHandler } = require("../../flashbots/handler");
const { buildFulfillOrderTxData } = require("./order");

// env
const PROVIDER_URL = process.env.ETHEREUM_PROVIDER_URL;
const SEAPORT_CONTRACT_ADDRESS = process.env.OPENSEA_SEAPORT_CONTRACT_ADDRESS;
const FLASHBOTS_FUTURE_BLOCK_OFFSET = process.env.OPENSEA_FLASHBOTS_FUTURE_BLOCK_OFFSET;
const PRIVATE_KEY = process.env.OPENSEA_PRIVATE_KEY;

const provider = new providers.JsonRpcProvider(PROVIDER_URL);
const signer = new Wallet(PRIVATE_KEY, provider);

// fulfill the specified order
async function fulfillOrder(order) {
    let flashbotsEnabled = false;
    if (process.env.FLASHBOTS_ENABLED) {
        flashbotsEnabled = true;
    }

    const signedTx = await buildFulfillOrderTx(order, flashbotsEnabled);
    return await sendTransaction(signedTx, flashbotsEnabled);
}

// build tx to fulfill order
async function buildFulfillOrderTx(order, flashbotsEnabled) {
    const tx = {
        value: BigNumber.from(order.currentPrice),
        data: buildFulfillOrderTxData(order),
        to: SEAPORT_CONTRACT_ADDRESS
    };

    if (flashbotsEnabled) {
        tx.maxPriorityFeePerGas = utils.parseUnits(process.env.OPENSEA_FLASHBOTS_PRIORITY_GAS_FEE, "gwei");
    }

    const populatedTx = await signer.populateTransaction(tx);
    const signedTx = await signer.signTransaction(populatedTx);

    return signedTx;
}

// send signed transaction
async function sendTransaction(signedTx, flashbotsEnabled) {
    if (flashbotsEnabled) {
        return await flashbotsHandler([signedTx], FLASHBOTS_FUTURE_BLOCK_OFFSET);
    }

    return await provider.sendTransaction(signedTx);
}

module.exports = {
    fulfillOrder
}
