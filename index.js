const express = require("express");
const xrpl = require("xrpl");
require("dotenv").config();
const { Attendify } = require("./attendify");
const {
  postToIPFS,
  ascii_to_hexa,
  makeid,
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
 * Checks if all required params were provided for requested endpoint
 * @param {Array} params - list of parameters that are necessary for correct execution of code in checked endpoint
 */
const requireParams = (params) => {
  return (req, res, next) => {
    const reqParamList = Object.keys(req.query);
    const reqValueList = Object.values(req.query);
    const hasAllRequiredParams = params.every((param) =>
      reqParamList.includes(param)
    );
    let hasNonEmptyParams = false;
    if (hasAllRequiredParams) {
      hasNonEmptyParams = reqValueList.every(
        (paramValue) => paramValue.length != 0
      );
    }
    if (!hasAllRequiredParams || !hasNonEmptyParams)
      return res
        .status(400)
        .send(
          `The following parameters are all required for this route: ${params.join(
            ", "
          )}`
        );
    next();
  };
};

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
 * @returns {object} result - An object with details for the claim event that was successfully created
 * @throws {Error} If any of the walletAddress, tokenCount, url, title, desc, or loc parameters are missing or have an invalid value
 */
app.get(
  "/api/mint",
  requireParams(["walletAddress", "tokenCount", "url", "title", "desc", "loc"]),
  (req, res) => {
    (async () => {
      try {
        const { walletAddress, tokenCount, url, title, desc, loc } =
          await req.query;
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
  }
);

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
app.get(
  "/api/claim",
  requireParams(["walletAddress", "type", "minter", "eventId"]),
  (req, res) => {
    (async () => {
      try {
        const { walletAddress, type, minter, eventId } = await req.query;
        let data = await fs.promises.readFile("participants.json", "utf-8");
        let requestedClaim = JSON.parse(data.toString()).data[
          parseInt(eventId)
        ];
        if (
          xrpl.Wallet.fromSeed(process.env.WALLET_SEED).classicAddress != minter
        )
          res.status(500).send({
            statusText: `minter address does not match local minter account`,
          });
        const claimableTokens = await AttendifyLib.getBatchNFTokens(
          minter,
          eventId
        );
        //Check if the requested claim event exists
        if (!requestedClaim) {
          return res.send({
            status: "404",
            // result: "The requested claim event does not exist.",
          });
        }
        // Check if user already claimed NFT
        if (
          requestedClaim.find((obj) => {
            return obj.user === walletAddress;
          }) != undefined
        )
          return res.send({
            status: "claimed",
            // result: requestedClaim,
          });
        // Check if there are any remaining NFTs
        if (claimableTokens.length == 0) {
          return res.send({
            status: "empty",
            // result: requestedClaim,
          });
        }
        // Checking which type of action should be performed
        if (type == 1) {
          return res.send({
            status: "success",
            result: claimableTokens.length,
          });
        } else {
          const claimOffer = await AttendifyLib.createSellOfferForClaim(
            walletAddress,
            process.env.WALLET_SEED,
            claimableTokens[0].NFTokenID
          );
          return res.send({
            status: "transferred",
            // result: claimableTokens,
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
  }
);

/**
 * Starts ownership verification process by generating unique ID for user that has to later be included in a Memo of signed tx
 * @route GET /api/startVerification
 * @param {string} walletAddress - The wallet address of the ticket owner
 * @returns {object} result - An object with generated Memo ID string
 */
app.get(
  "/api/startVerification",
  requireParams(["walletAddress"]),
  (req, res) => {
    (async () => {
      try {
        const { walletAddress } = await req.query;
        const EXPECTED_MEMO_ID = await makeid(256);
        console.log(EXPECTED_MEMO_ID);
        await AttendifyLib.signatureMap.set(walletAddress, EXPECTED_MEMO_ID);
        return res.send({
          result: EXPECTED_MEMO_ID,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({
          statusText: `${error}`,
        });
      }
    })();
  }
);

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
app.get(
  "/api/verifyOwnership",
  requireParams(["walletAddress", "signature", "minter", "eventId"]),
  (req, res) => {
    (async () => {
      try {
        const { walletAddress, signature, minter, eventId } = await req.query;
        if (
          xrpl.Wallet.fromSeed(process.env.WALLET_SEED).classicAddress != minter
        )
          res.status(500).send({
            statusText: `minter address does not match local minter account`,
          });
        const isOwnershipVerified = await AttendifyLib.verifyOwnership(
          walletAddress,
          signature,
          minter,
          eventId
        );
        if (isOwnershipVerified === true || isOwnershipVerified === false) {
          return res.status(200).send({
            result: isOwnershipVerified,
          });
        } else {
          return res.status(500).send({
            statusText: isOwnershipVerified.toString(),
          });
        }
      } catch (error) {
        console.error(error);
        res.status(500).send({
          statusText: `${error}`,
        });
      }
    })();
  }
);

/**
 * Looks up attendees for particular event
 * @route GET /api/attendees
 * @param {string} minter - The minter address of the event
 * @param {string} eventId - The ID of the event
 * @returns {object} result - An object with the list of attendees
 * @throws {Error} If either the minter or eventId parameters are missing or have an invalid value
 */
app.get("/api/attendees", requireParams(["minter", "eventId"]), (req, res) => {
  (async () => {
    try {
      const { minter, eventId } = await req.query;
      if (
        xrpl.Wallet.fromSeed(process.env.WALLET_SEED).classicAddress != minter
      )
        res.status(500).send({
          statusText: `minter address does not match local minter account`,
        });
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
