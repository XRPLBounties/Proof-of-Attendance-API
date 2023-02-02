const { NFTokenMintFlags, NFTokenCreateOfferFlags } = require("xrpl");
const xrpl = require("xrpl");
const verifySignature = require("verify-xrpl-signature").verifySignature;
require("dotenv").config();
const {
  ERR_ATTENDIFY,
  ERR_IPFS,
  ERR_NOT_FOUND,
  ERR_PARAMS,
  ERR_XRPL,
} = require("./utils");
const fs = require("fs");

/**
 * Attendify is API library for proof of attendance infrastructure on XRPL
 * It allows for creation of new claim events, checking whether claim is possible,
 * claiming, verifying NFT ownership, and fetching list of participants for a particular event
 * @author JustAnotherDevv
 * @version 1.2.0
 */
class Attendify {
  /**
   * Initializes a new instance of the Attendify class
   */
  constructor() {
    // Initializes the next event ID to 0
    this.nextEventId = 0;
    // Map with temporary numbers used to prove wallet ownership for verification
    this.signatureMap = new Map();
  }

  /**
   * Adds a participant to an event or creates event array for participants
   * Saves the JSON with participants to local JSON file
   * @param {string} walletAddress - The address of the participant's wallet
   * @param {number} eventId - The ID of the event
   * @returns {boolean} - `true` if the participant was added successfully, `false` otherwise
   */
  async addParticipant(walletAddress, eventId) {
    try {
      if (eventId == undefined) throw new Error(`${ERR_PARAMS}`);
      let data = await fs.promises.readFile("participants.json", "utf-8");
      console.log(typeof data);
      let participantsJson;
      if (data == "") {
        participantsJson = { data: [[]] };
      } else {
        participantsJson = JSON.parse(data);
        if (participantsJson.data[eventId]) {
          // Check if user wallet is already participant for selected event
          const userParticipantData = participantsJson.data[eventId].find(
            (obj) => {
              return obj.user === walletAddress;
            }
          );
          if (userParticipantData != undefined) return true;
        }
      }
      if (walletAddress == undefined) {
        // Pushes an empty array to the participants.json file if no wallet address is provided
        participantsJson.data.push([]);
      } else if (participantsJson.data[eventId] == undefined) {
        // Adds the participant to the event's list of participants and creates and empty array for participants from chosen event
        participantsJson.data.push([
          {
            user: walletAddress,
          },
        ]);
      } else {
        // Adds the user wallet to the event's list of participants if it's not already there
        participantsJson.data[eventId].push({
          user: walletAddress,
        });
      }

      await fs.promises.writeFile(
        "participants.json",
        JSON.stringify(participantsJson)
      );
      return true;
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  /**
   * Creates new XRPL wallet and funds it
   * @returns {object} - Object with new wallet that was created and funded
   */
  async getNewAccount() {
    try {
      const client = new xrpl.Client(process.env.SELECTED_NETWORK);
      await client.connect();
      const fund_result = await client.fundWallet();
      const newWallet = fund_result.wallet;
      await client.disconnect();
      return newWallet;
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  /**
   * Checks for all NFTs owned by a particular address
   * @param {string} address - The wallet address to check
   * @param {string} [taxon] - An optional parameter used to filter the NFTs by taxon
   * @returns {object[]} - An array of NFTs owned by the given address. If no NFTs are found, returns an empty array
   */
  async getBatchNFTokens(address, taxon) {
    try {
      if (!address) throw new Error(`${ERR_PARAMS}`);
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

  /**
   * Creates a sell offer for NFT from selected event
   * The offer has to be accepted by the buyer once it was returned
   * * In current design checks to see whether or not there are still any NFTs
   * * to claim are done outside of this class in related API route
   * @ToDo Whitelist system to only allow claiming from certain adresses
   * @ToDo Deadline system where NFTs can only be claimed before the event ends
   * @ToDo Return previously created offer for user that's already event participant
   * @param {string} buyer - wallet address of user trying to claim NFT
   * @param {string} minterSeed - seed of wallet storing NFTs from selected event
   * @param {string} TokenID - ID for NFT that should be claimed
   * @returns {object} - The metadata of the sell offer for a given NFT from selected event
   * @throws {Error} - If any of the required parameters are missing or if there is an issue creating the sell offer
   */
  async createSellOfferForClaim(buyer, minterSeed, TokenID) {
    try {
      if (!buyer || !minterSeed || !TokenID) throw new Error(`${ERR_PARAMS}`);
      const seller = xrpl.Wallet.fromSeed(minterSeed);
      const client = new xrpl.Client(process.env.SELECTED_NETWORK);
      await client.connect();
      // Preparing transaction data
      let transactionBlob = {
        TransactionType: "NFTokenCreateOffer",
        Account: seller.classicAddress,
        NFTokenID: TokenID,
        Amount: "0",
        Flags: NFTokenCreateOfferFlags.tfSellNFToken,
      };
      transactionBlob.Destination = buyer;
      // Submitting transaction to XRPL
      const tx = await client.submitAndWait(transactionBlob, {
        wallet: seller,
      });
      let nftSellOffers = await client.request({
        method: "nft_sell_offers",
        nft_id: TokenID,
      });
      if (nftSellOffers == null) throw new Error(`${ERR_XRPL}`);
      // Getting details of sell offer for buyer wallet address
      let offerToAccept = nftSellOffers.result.offers.find((obj) => {
        return obj.destination === buyer;
      });
      client.disconnect();
      const curentEventId = (await xrpl.parseNFTokenID(TokenID)).Taxon;
      await this.addParticipant(buyer, curentEventId);
      return offerToAccept;
    } catch (error) {
      console.error(error);
      throw new Error(error);
      // return error;
    }
  }

  /**
   * Retrieves a list of all tickets owned by a particular address
   * @param {string} walletAddress - The wallet address to check
   * @param {object} client - The XRPL client to use for the request
   * @returns {object[]} - An array of tickets owned by the given address. If no tickets are found, returns an empty array
   */
  async getAccountTickets(walletAddress, client) {
    let res = await client.request({
      command: "account_objects",
      account: walletAddress,
      type: "ticket",
    });
    let resTickets = res.result.account_objects;
    for (;;) {
      console.log("marker, ", res["result"]["marker"]);
      if (res["result"]["marker"] === undefined) {
        return resTickets;
      }
      res = await client.request({
        method: "account_objects",
        account: walletAddress,
        type: "ticket",
        marker: res["result"]["marker"],
      });
      console.log(res.result.account_objects.length);
      return resTickets.concat(res.result.account_objects);
    }
  }

  /**
   * Mints NFTs for created event and saves IPFS hash with data about event to Uri field
   * @param {string} walletAddress - Account of user requesting creation of event
   * @param {integer} nftokenCount - Amount of NFTs that should be minted for event
   * @param {string} url - IPFS hash with metadata for NFT
   * @param {string} title - Name of event
   * @param {string} minterSeed - The seed of the wallet that will be minting the NFTs
   * @param {number} curentEventId - The event ID of the NFTs. Defaults to the next event ID in the sequence
   * @returns {object} - An object containing the metadata related to new event for which NFTs were minted
   * @throws {Error} - If any of the required parameters are missing or if there is an issue minting the NFTs
   */
  async batchMint(
    walletAddress,
    nftokenCount,
    url,
    title,
    minterSeed,
    curentEventId = this.nextEventId
  ) {
    try {
      if (!walletAddress || !nftokenCount || !url || !title)
        throw new Error(`${ERR_PARAMS}`);
      const client = new xrpl.Client(process.env.SELECTED_NETWORK);
      await client.connect();
      const vaultWallet = xrpl.Wallet.fromSeed(minterSeed);
      let remainingTokensBeforeTicketing = nftokenCount;
      for (let currentTickets; remainingTokensBeforeTicketing != 0; ) {
        let maxTickets =
          250 -
          (await this.getAccountTickets(vaultWallet.address, client)).length;
        console.log("Max tickets", maxTickets);
        if (maxTickets == 0) throw new Error(`${ERR_XRPL}`);
        const balanceForTickets = parseInt(
          ((await client.getXrpBalance(vaultWallet.address)) - 1) / 2
        );
        if (balanceForTickets < maxTickets) maxTickets = balanceForTickets;
        if (remainingTokensBeforeTicketing > maxTickets) {
          currentTickets = maxTickets;
        } else {
          currentTickets = remainingTokensBeforeTicketing;
        }
        // Get account information, particularly the Sequence number.
        const account_info = await client.request({
          command: "account_info",
          account: vaultWallet.address,
        });
        let my_sequence = account_info.result.account_data.Sequence;
        // Create the transaction hash.
        const ticketTransaction = await client.autofill({
          TransactionType: "TicketCreate",
          Account: vaultWallet.address,
          TicketCount: currentTickets,
          Sequence: my_sequence,
        });
        // Sign the transaction.
        const signedTransaction = vaultWallet.sign(ticketTransaction);
        // Submit the transaction and wait for the result.
        const tx = await client.submitAndWait(signedTransaction.tx_blob);
        let resTickets = await this.getAccountTickets(
          vaultWallet.address,
          client
        );
        // Populate the tickets array variable.
        let tickets = [];
        for (let i = 0; i < currentTickets; i++) {
          //console.log({ index: i, res: resTickets[i] });
          tickets[i] = resTickets[i].TicketSequence;
        }
        // Mint NFTokens
        for (let i = 0; i < currentTickets; i++) {
          console.log(
            "minting ",
            i + 1 + (nftokenCount - remainingTokensBeforeTicketing),
            "/",
            nftokenCount,
            " NFTs"
          );
          const transactionBlob = {
            TransactionType: "NFTokenMint",
            Account: vaultWallet.classicAddress,
            URI: xrpl.convertStringToHex(url),
            Flags: NFTokenMintFlags.tfTransferable,
            /*{
              tfBurnable: true,
              tfTransferable: true,
            },*/
            TransferFee: parseInt(0),
            Sequence: 0,
            TicketSequence: tickets[i],
            LastLedgerSequence: null,
            NFTokenTaxon: curentEventId,
          };
          // Submit signed blob.
          const tx = await client.submit(transactionBlob, {
            wallet: vaultWallet,
          });
        }
        remainingTokensBeforeTicketing -= currentTickets;
      }
      client.disconnect();
      this.nextEventId++;
      await this.addParticipant(undefined, curentEventId);
      return {
        eventId: curentEventId,
        account: vaultWallet.classicAddress,
        owner: walletAddress,
        URI: url,
        title: title,
        claimable: nftokenCount,
      };
    } catch (error) {
      console.error(error);
      throw new Error(error);
      // return error;
    }
  }

  /**
   * Verifies whether or not walletAddress account is owner of NFT from event with eventId that was issued by wallet that matches minter parameter
   * * Wallet from signature has to match walletAddress
   * @param {string} walletAddress - Address of wallet for the user wanting to verify
   * @param {string} signature - Signature that should be signed by the same account as walletAddress. This could be done either using XUMM or `sign` function from xrpl library. The mock transaction from signature has to contain memo with number generated for walletAddress. See test.js for example implementation of this
   * @param {string} minter - The address of the wallet that minted the NFT
   * @param {number} eventId - The event ID of the NFT
   * @returns {boolean} Indicats whether the walletAddress owns any NFT from particular event
   */
  async verifyOwnership(walletAddress, signature, minter, eventId) {
    try {
      if (!walletAddress || !signature || !minter || !eventId)
        throw new Error(`${ERR_PARAMS}`);
      const verifySignatureResult = verifySignature(signature);
      const TX_MEMO = xrpl.convertHexToString(
        xrpl.decode(signature).Memos[0].Memo.MemoData
      );
      const EXPECTED_MEMO_ID = this.signatureMap.get(walletAddress);
      // Checking if signature is valid, if user from signature is walletAddress and if Memo number is correct one
      if (
        verifySignatureResult.signatureValid != true ||
        verifySignatureResult.signedBy != walletAddress ||
        TX_MEMO != EXPECTED_MEMO_ID
      )
        throw new Error(`${ERR_PARAMS}`);
      // Getting user NFTs and checking whether any NFT was issued by minter address
      const accountNfts = await await this.getBatchNFTokens(
        walletAddress,
        eventId
      );
      if (accountNfts.length == 0) return false;
      for (let i = 0; i != accountNfts.length; i++) {
        if (accountNfts[i].Issuer == minter) return true;
        if (i == accountNfts.length - 1) return false;
      }
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  /**
   * Looks up the list of users that started process of claiming the NFT
   * @ToDo Add permissions to configure who can access the list of participants
   * @param {string} minter - The wallet address of the event creator
   * @param {string} eventId - ID of selected claim event
   * @returns {array[]} An array of objects with data for users that requested to participate in event
   * @throws {Error} If the `minter` or `eventId` parameters are not provided.
   * @throws {Error} If the event does not exist
   */
  async attendeesLookup(minter, eventId) {
    try {
      if (!minter || !eventId) throw new Error(`${ERR_PARAMS}`);
      // Find selected event
      let data = await fs.promises.readFile("participants.json", "utf-8");
      let participantsJson = JSON.parse(data.toString());
      console.log(data);
      const attendees = participantsJson.data[eventId];
      if (!attendees) throw new Error(`${ERR_ATTENDIFY}`);
      // Retrieve and return participants from claimable array
      return attendees;
    } catch (error) {
      console.error(error);
      return error;
    }
  }
}

module.exports = {
  Attendify,
};
