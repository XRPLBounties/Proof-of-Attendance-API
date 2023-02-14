const xrpl = require("xrpl");
require("dotenv").config();

/**
 * Run this file locally with 2 arguments just like the example below to generate signed tx blob
 * - The first argument is seed for the user wallet
 * - The second argument should be NFT offer ID returned from `api/claim` endpoint
 * `node .\acceptOffer.js sEdVMJSLjuTAjaSeeZ6TEkpUWuTS83j 80517CC6087108B777710DFD0C48B6CB66A43947A96CA4C4B145574E27E9749A`
 */

let nftOffer;
let myWallet;

if (process && typeof process.exit == "function") {
  nftOffer = process.argv.length > 3 ? process.argv[3] : "";
  myWallet =
    process.argv.length > 2 ? xrpl.Wallet.fromSeed(process.argv[2]) : "";
}

async function getBatchNFTokens(address, taxon) {
  try {
    if (!address) throw new Error(`Address can't be emty`);
    const client = new xrpl.Client(process.env.SELECTED_NETWORK);
    await client.connect();
    let nfts = await client.request({
      method: "account_nfts",
      account: address,
    });
    let accountNfts = nfts.result.account_nfts;
    //console.log("Found ", accountNfts.length, " NFTs in account ", address);
    for (;;) {
      if (nfts["result"]["marker"] === undefined) {
        break;
      } else {
        nfts = await client.request({
          method: "account_nfts",
          account: address,
          marker: nfts["result"]["marker"],
        });
        accountNfts = accountNfts.concat(nfts.result.account_nfts);
      }
    }
    client.disconnect();
    if (taxon) return accountNfts.filter((a) => a.NFTokenTaxon == taxon);
    return accountNfts;
  } catch (error) {
    console.error(error);
    return error;
  }
}

async function acceptNFTOffer() {
  try {
    const client = new xrpl.Client(process.env.SELECTED_NETWORK);
    await client.connect();

    console.log(myWallet.classicAddress);

    console.log(
      `Amount of NFTs that were found in account before claim: `,
      (await getBatchNFTokens(myWallet.classicAddress)).length
    );

    const transactionBlob = {
      TransactionType: "NFTokenAcceptOffer",
      Account: myWallet.classicAddress,
      NFTokenSellOffer: nftOffer,
    };

    const tx = await client.submitAndWait(transactionBlob, {
      wallet: myWallet,
    });

    await client.disconnect();
    if (tx.result.meta.TransactionResult == "tecOBJECT_NOT_FOUND")
      throw new Error("NFT wasn't minted successfuly");

    console.log(
      `Amount of NFTs that were found in account after claim: `,
      (await getBatchNFTokens(myWallet.classicAddress)).length
    );
    console.log(tx, `\n`, `NFT was minted successfully`);
  } catch (error) {
    console.error(error);
    return error;
  }
}

acceptNFTOffer();
