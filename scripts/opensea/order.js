const Web3 = require("web3");
const { OpenSeaSDK, Network } = require("opensea-js");

// constants
const CONDUIT_KEY = "0x0000000000000000000000000000000000000000000000000000000000000000";

// env
const PROVIDER_URL = process.env.ETHEREUM_PROVIDER_URL;
const NETWORK = process.env.OPENSEA_SDK_NETWORK;
const API_KEY = process.env.OPENSEA_API_KEY;

const provider = new Web3.providers.HttpProvider(PROVIDER_URL);

// OpenSea SDK instance
const openseaSDK = new OpenSeaSDK(provider, {
    networkName: NETWORK,
    apiKey: NETWORK == Network.Main ? API_KEY : null
});

// get listing with the specified token address and id
async function getListing(tokenAddress, tokenId) {
    const order = await openseaSDK.api.getOrder({
        protocol: "seaport",
        side: "ask",
        assetContractAddress: tokenAddress,
        tokenIds: [tokenId]
    });

    return order;
}

// check if the given order is valid
function isValidOrder(order) {
    return order.expirationTime > Date.now() / 1000 && !order.cancelled && !order.finalized;
}

// build tx payload for order fulfillment
function buildFulfillOrderTxData(order) {
    return openseaSDK.seaport.contract.interface.encodeFunctionData("fulfillOrder", [order.protocolData, CONDUIT_KEY]);
}

module.exports = {
    getListing,
    isValidOrder,
    buildFulfillOrderTxData
}
