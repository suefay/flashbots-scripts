const { utils } = require("ethers");

// map collection slugs to the corresponding target prices
const collections = {};

// set collection slugs and target prices
function setCollections(slugs, targetPrices) {
    if (slugs.length != targetPrices.length) {
        throw new Error("the number of collection slugs must be equal to the number of target prices");
    }

    slugs.map((slug, i) => {
        collections[slug] = utils.parseEther(targetPrices[i]);
    });
}

// get the target price of the given collection
function getCollectionTargetPrice(slug) {
    return collections[slug];
}

module.exports = {
    setCollections,
    getCollectionTargetPrice
}
