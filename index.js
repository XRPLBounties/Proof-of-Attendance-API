const express = require("express");
const xrpl = require("xrpl");
require("dotenv").config();
const { Attendify } = require("./attendify");
const {
  postToIPFS,
  ascii_to_hexa,
  ERR_ATTENDIFY,
  ERR_IPFS,
  ERR_NOT_FOUND,
  ERR_PARAMS,
  ERR_XRPL,
} = require("./utils");
const fs = require("fs");

const app = express();
let AttendifyLib = new Attendify();

/**
 * Creates new event,
 * Uploads its metadata to IPFS
 * and mints a batch of NFTs for it
 * @route GET /api/mint
 * @param {string} walletAddress - The wallet address to mint the NFT tokens to
 * @param {integer} tokenCount - The number of NFT tokens to mint
 * @param {string} url - The URL of the event
 * @param {string} title - The title of the event
 * @param {string} desc - The description of the event
 * @param {string} loc - The location of the event
 * @returns {object} result - An object with the mint result
 * @throws {Error} If any of the walletAddress, tokenCount, url, title, desc, or loc parameters are missing or have an invalid value
 */
app.get("/api/mint", (req, res) => {
  (async () => {
    try {
      const { walletAddress, tokenCount, url, title, desc, loc } =
        await req.query;
      if (
        walletAddress.length == 0 ||
        tokenCount.length == 0 ||
        url.length == 0 ||
        title.length == 0 ||
        walletAddress.length == 0 ||
        desc.length == 0 ||
        loc.length == 0
      )
        throw new Error(`${ERR_PARAMS}`);
      const vaultWallet = await xrpl.Wallet.fromSeed(process.env.WALLET_SEED);
      let metadataStructure = {
        title: title,
        description: desc,
        collectionSize: tokenCount,
        location: loc,
        date: new Date().toLocaleDateString().toString(),
        URI: url,
        account: vaultWallet.address,
      };

      const metadata = await postToIPFS(JSON.stringify(metadataStructure)); //.substring(21);

      console.log(metadata);

      return res.send({
        result: await AttendifyLib.batchMint(
          walletAddress,
          parseInt(tokenCount),
          metadata,
          title,
          process.env.WALLET_SEED
        ),
      });
    } catch (error) {
      console.error(error);
      res.status(500).send({
        statusText: `${error}`,
      });
    }
  })();
});

/**
 * Requests claim for specified event
 * * The sell offer that's returned has to be accepted by user to finish process of claiming NFT
 * @route GET /api/claim
 * @param {string} walletAddress - The wallet address of the user trying to claim
 * @param {integer} type - The type of claim (1 for checking claim status and metadata, 2 for claiming)
 * @param {string} minter - The minter address of the event
 * @param {string} eventId - The ID of the event
 * @returns {object} result - An object with the event metadata and offer for NFT
 * @throws {Error} If any of the walletAddress, id, type, minter, or eventId parameters are missing or have an invalid value
 */
app.get("/api/claim", (req, res) => {
  (async () => {
    try {
      const { walletAddress, type, minter, eventId } = await req.query;
      if (
        walletAddress.length == 0 ||
        type.length == 0 ||
        minter.length == 0 ||
        eventId.length == 0
      )
        throw new Error(`${ERR_PARAMS}`);
      let data = await fs.promises.readFile("participants.json", "utf-8");
      let requestedClaim = JSON.parse(data.toString()).data[parseInt(eventId)];
      console.log(requestedClaim);
      const claimableTokens = await AttendifyLib.getBatchNFTokens(
        minter,
        eventId
      );
      //Check if the requested claim event exists
      if (!requestedClaim) {
        return res.send({
          status: "404",
          result: "The requested claim event does not exist.",
        });
      }
      // Check if user already claimed NFT
      if (
        requestedClaim.find((obj) => {
          return obj.name === walletAddress;
        }) != undefined
      )
        return res.send({
          status: "claimed",
          result: requestedClaim,
        });
      //Check if there are any remaining NFTs
      if (claimableTokens.length == 0) {
        return res.send({
          status: "empty",
          result: requestedClaim,
        });
      }
      //console.log(claimableTokens);
      if (type == 1) {
        return res.send({
          status: "success",
          result: claimableTokens,
        });
      } else {
        const claimOffer = await AttendifyLib.createSellOfferForClaim(
          walletAddress,
          process.env.WALLET_SEED,
          claimableTokens[0].NFTokenID
        );
        return res.send({
          status: "transferred",
          result: claimableTokens,
          offer: claimOffer,
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).send({
        statusText: `${error}`,
      });
    }
  })();
});

/**
 * Verifies ownership of NFT with provided id for particular user
 * * Signature has to match with walletAddress account
 * @route GET /api/verifyOwnership
 * @param {string} walletAddress - The wallet address of the ticket owner
 * @param {string} signature - The signature of the ticket
 * @param {string} minter - The minter address of the event
 * @param {string} eventId - The ID of the event
 * @returns {object} result - An object with the verification result
 * @throws {Error} If any of the walletAddress, signature, minter, or eventId parameters are missing or have an invalid value
 */
app.get("/api/verifyOwnership", (req, res) => {
  (async () => {
    try {
      const { walletAddress, signature, minter, eventId } = await req.query;
      if (
        walletAddress.length == 0 ||
        signature.length == 0 ||
        minter.length == 0 ||
        eventId.length == 0
      )
        throw new Error(`${ERR_PARAMS}`);
      return res.send({
        result: await AttendifyLib.verifyOwnership(
          walletAddress,
          signature,
          minter,
          eventId
        ),
      });
    } catch (error) {
      console.error(error);
      res.status(500).send({
        statusText: `${error}`,
      });
    }
  })();
});

/**
 * Looks up attendees for particular event
 * @route GET /api/attendees
 * @param {string} minter - The minter address of the event
 * @param {string} eventId - The ID of the event
 * @returns {object} result - An object with the list of attendees
 * @throws {Error} If either the minter or eventId parameters are missing or have an invalid value
 */
app.get("/api/attendees", (req, res) => {
  (async () => {
    try {
      const { minter, eventId } = await req.query;
      if (minter.length == 0 || eventId.length == 0)
        throw new Error(`${ERR_PARAMS}`);
      return res.send({
        result: await AttendifyLib.attendeesLookup(minter, eventId),
      });
    } catch (error) {
      console.error(error);
      res.status(500).send({
        statusText: `${error}`,
      });
    }
  })();
});

/**
 * Creates new XRPL account for the end user and funds it.
 * * Currently used with UI for testing purposes
 * @route GET /api/getNewAccount
 * @returns {object} result - An object with the new wallet
 * @throws {Error} If creating and funding the new wallet wasn't completed
 */
app.get("/api/getNewAccount", (req, res) => {
  (async () => {
    try {
      return res.send({
        result: await AttendifyLib.getNewAccount(),
      });
    } catch (error) {
      console.error(error);
      res.status(500).send({
        statusText: `${error}`,
      });
    }
  })();
});

module.exports = app;
