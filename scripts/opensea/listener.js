const { OpenSeaStreamClient } = require("@opensea/stream-js");
const { WebSocket } = require("ws");
const { handleItemListedEvent } = require("./handler");
const {setCollections}= require("./collections");
const { logger } = require("../../common/logger");

// constants
const SEPARATOR = ",";

// env
const API_KEY = process.env.OPENSEA_API_KEY;
const NETWORK = process.env.OPENSEA_STREAM_NETWORK;
const COLLECTION_SLUGS = process.env.OPENSEA_COLLECTION_SLUGS.split(SEPARATOR);
const COLLECTION_TARGET_PRICES = process.env.OPENSEA_COLLECTION_TARGET_PRICES.split(SEPARATOR);

// start
async function start() {
    setCollections(COLLECTION_SLUGS,COLLECTION_TARGET_PRICES);
    subscribeEvents(COLLECTION_SLUGS);
}

// subscribe observed events for the specified collections
function subscribeEvents(collectionSlugs) {
    const client = new OpenSeaStreamClient({
        network: NETWORK,
        token: API_KEY,
        connectOptions: {
            transport: WebSocket
        }
    });

    collectionSlugs.map(collectionSlug => {
        // subscribe item listed event
        client.onItemListed(collectionSlug, handleItemListedEvent);
    });
}

start()
    .then(logger.info(`opensea event listener started, collections: ${COLLECTION_SLUGS}`))
    .catch(console.error);
