const { utils, BigNumber } = require("ethers");
const { getListing, isValidOrder } = require("./order");
const { getCollectionTargetPrice } = require("./collections");
const { fulfillOrder } = require("./transaction");
const { logger } = require("../../common/logger");

// handler for item listed event
async function handleItemListedEvent(event) {
    logger.info(`item listed, collection: ${event.payload.collection.slug}, id: ${event.payload.item.nft_id}`);

    if (!filterItemListedEvent(event)) return;

    try {
        if (isSatisfyingItem(event.payload.collection.slug, event.payload.base_price)) {
            logger.info(`listed item satisfies the target, id: ${event.payload.item.nft_id}`);

            handleSatisfyingItem(event.payload.collection.slug, event.payload.item.nft_id);
        }
    } catch (error) {
        logger.error(`event handling failed, event: ${JSON.stringify(event)}, err: ${error.message}`);
    }
}

// filter out item listed event not conforming to the specific condition
function filterItemListedEvent(event) {
    return event.payload.item.chain.name == "ethereum" && !event.payload.listing_type && !event.payload.is_private;
}

// handler for satisfying item
async function handleSatisfyingItem(collectionSlug, nftId) {
    const [tokenAddress, tokenId] = parseNFTId(nftId);

    const order = await getListing(tokenAddress, tokenId);
    if (!isValidOrder(order)) {
        logger.info(`invalid order retrieved, id: ${nftId}`);
        return;
    }

    if (!ensureOrder(order, collectionSlug)) {
        logger.info(`order discarded for not satisfying the target any more, id: ${nftId}`);
        return;
    }

    return await fulfillOrder(order);
}

// check if the listed item satisfies the target
function isSatisfyingItem(collectionSlug, price) {
    const targetPirce = getCollectionTargetPrice(collectionSlug);
    return BigNumber.from(price).lte(targetPirce);
}

// ensure that listing still satisfies the target
function ensureOrder(order, collectionSlug) {
    const targetPirce = getCollectionTargetPrice(collectionSlug);
    return BigNumber.from(order.currentPrice).lte(targetPirce);
}

// parse nft id components
function parseNFTId(nftId) {
    const components = nftId.split("/");
    return [components[1], components[2]];
}

module.exports = {
    handleItemListedEvent
}
