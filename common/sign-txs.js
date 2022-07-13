const { Signer } = require("ethers");

// sign the same tx with a set of signers separately
async function signTx(tx, signers) {
    const signedTxsPromises = signers.map(async (signer, i) => {
        if (!signer instanceof Signer) {
            throw new Error(`invalid signer ${i}`);
        }

        const newTx = await signer.populateTransaction(tx);
        
        return await signer.signTransaction(newTx);
    });

    return await Promise.all(signedTxsPromises);
}

// sign a set of txs with a corresponding set of signers
async function signTxs(txs, signers) {
    if (txs.length != signers.length) {
        throw new Error(`txs count is not equal to signers count`);
    }

    const signedTxsPromises = signers.map(async (signer, i) => {
        if (!signer instanceof Signer) {
            throw new Error(`invalid signer ${i}`);
        }

        const tx = await signer.populateTransaction(txs[i]);

        return await signer.signTransaction(tx);
    });

    return await Promise.all(signedTxsPromises);
}

module.exports = {
    signTx,
    signTxs
}
