require("dotenv").config();
const xrpl = require("xrpl");
const app = require("./index.js");
const supertest = require("supertest");
const requestWithSupertest = supertest(app);
const assert = require("assert");
var should = require("chai").should();

// Mock data for tests
const minter = xrpl.Wallet.fromSeed(process.env.WALLET_SEED).address;
const testUser = {
  publicKey:
    "ED3467208169A8978DD8A66D20D95E8AC63DD2B7675A5A072A49C58832F93A7BF0",
  privateKey:
    "EDEC608D34F5825C1EDAFC561DE2BBCB12E953CDD5D725D1691EABFECF253A195D",
  classicAddress: "rJnCJZZXSSnuDi9YVgrAatVqSvktTeXr5r",
  seed: "sEdTG44pDuiojoi7pH9R5qzytEuYurd",
};
const testNftId =
  "000300003CBB7B1E0212681492733BDA77986A6A7C4C2B4A2DCBAB9D00000002";
let walletForSignatureVerification = {
  publicKey:
    "ED57D41105FC480545763677D2100C8949324A97811FE5CB45594B5E73991BBF92",
  privateKey:
    "EDE60F3996E5A0855FEF0C1E31A894D5085294A12D364FB11421F37B7683A1F6B2",
  classicAddress: "raY33uxEbZFg7YS1ofFRioeENLsVdCgpC5",
  seed: "sEdVMJSLjuTAjaSeeZ6TEkpUWuTS83j",
};

const myWallet = xrpl.Wallet.fromSeed(walletForSignatureVerification.seed);
let txJSON;
const txNoMemo = {
  Account: walletForSignatureVerification.address,
  TransactionType: "AccountSet",
  Fee: "12",
  Sequence: 5,
  Domain: "6578616D706C652E636F6D",
  SetFlag: 5,
  MessageKey:
    "03AB40A0490F9B7ED8DF29D246BF2D6269820A0EE7742ACDD457BEA7C7D0931EDB",
};
const txWrongMemo = {
  Account: walletForSignatureVerification.classicAddress,
  TransactionType: "AccountSet",
  Fee: "12",
  Sequence: 5,
  Domain: "6578616D706C652E636F6D",
  SetFlag: 5,
  MessageKey:
    "03AB40A0490F9B7ED8DF29D246BF2D6269820A0EE7742ACDD457BEA7C7D0931EDB",
  Memos: [
    {
      Memo: {
        MemoData: xrpl.convertStringToHex("13"),
      },
    },
  ],
};

// Empty variables for tests
let newUser;
let testEvent;
let testMemoId = 0;
//let nftOffer;

// API tests
describe("Testing typical user flow", function () {
  it("Getting new wallet account", async () => {
    return requestWithSupertest.get("/api/getNewAccount").then(async (r) => {
      console.log(JSON.parse(r.text).result);
      newUser = await JSON.parse(r.text).result;
      r.res.statusCode.should.equal(200);
      JSON.parse(r.text).result.should.be.a("object");
    });
  }).timeout(60000);

  it("Minting NFTs for new event", async () => {
    return requestWithSupertest
      .get(
        `/api/mint?walletAddress=${testUser.classicAddress}&tokenCount=3&url=ipfs://QmQDDD1cNgnyhPC4pBLZKhVeu12oyfCAJoWr1Qc1QgbkPN&title=test_title&desc=test_description&loc=Warsaw`
      )
      .then(async (r) => {
        console.log(JSON.parse(r.text).result);
        testEvent = await JSON.parse(r.text).result;
        r.res.statusCode.should.equal(200);
        JSON.parse(r.text).result.should.be.a("object");
      });
  }).timeout(600000);

  /**
   * * Only uncomment if you want to test minting for 300 NFTs at the same time to see if ticketing and paginating works correctly
   * * WARNING! It might take a really long time to complete
  it("Minting NFTs with tokenCount exceding 250", async () => {
    return requestWithSupertest
      .get(
        `/api/mint?walletAddress=${testUser.classicAddress}&tokenCount=300&url=ipfs://QmQDDD1cNgnyhPC4pBLZKhVeu12oyfCAJoWr1Qc1QgbkPN&title=test_title&desc=test_description&loc=Warsaw`
      )
      .then(async (r) => {
        console.log(JSON.parse(r.text).result);
        testEvent = await JSON.parse(r.text).result;
        r.res.statusCode.should.equal(200);
        JSON.parse(r.text).result.should.be.a("object");
      });
  }).timeout(6000000);
  */

  it("Checking if it's possible to claim NFT for event", async () => {
    return requestWithSupertest
      .get(
        `/api/claim?walletAddress=${testUser.classicAddress}&minter=${minter}&eventId=${testEvent.eventId}&type=1`
      )
      .then((r) => {
        console.log(JSON.parse(r.text).result.length);
        r.res.statusCode.should.equal(200);
        // JSON.parse(r.text).result.should.be.a("object");
        JSON.parse(r.text).result.should.be.a("array");
        JSON.parse(r.text).status.should.equal("success");
      });
  }).timeout(600000);

  it("Claiming offer for NFT from event", async () => {
    return requestWithSupertest
      .get(
        `/api/claim?walletAddress=${testUser.classicAddress}&minter=${minter}&eventId=${testEvent.eventId}&type=2`
      )
      .then((r) => {
        console.log(JSON.parse(r.text).result.length);
        console.log("offer ", JSON.parse(r.text).offer);
        r.res.statusCode.should.equal(200);
        // JSON.parse(r.text).result.should.be.a("object");
        JSON.parse(r.text).result.should.be.a("array");
        JSON.parse(r.text).status.should.equal("transferred");
      });
  }).timeout(600000);

  it("Looking up if the test user is on the attendees list for test event", async () => {
    return requestWithSupertest
      .get(`/api/attendees?minter=${minter}&eventId=${testEvent.eventId}`)
      .then((r) => {
        console.log(JSON.parse(r.text));
        r.res.statusCode.should.equal(200);
        JSON.parse(r.text).result.should.be.a("array");
        JSON.parse(r.text).result[0].user.should.equal(testUser.classicAddress);
      });
  }).timeout(600000);

  it("Trying to verify NFT ownership before obtaining verification ID", async () => {
    txJSON = {
      Account: myWallet.address,
      TransactionType: "AccountSet",
      Fee: "12",
      Sequence: 5,
      Domain: "6578616D706C652E636F6D",
      SetFlag: 5,
      MessageKey:
        "03AB40A0490F9B7ED8DF29D246BF2D6269820A0EE7742ACDD457BEA7C7D0931EDB",
      Memos: [
        {
          Memo: {
            MemoData: xrpl.convertStringToHex(testMemoId.toString()),
          },
        },
      ],
    };
    const signature = await myWallet.sign(txJSON);
    return requestWithSupertest
      .get(
        `/api/verifyOwnership?walletAddress=${walletForSignatureVerification.classicAddress}&signature=${signature.tx_blob}&minter=raY33uxEbZFg7YS1ofFRioeENLsVdCgpC5&eventId=${testEvent.eventId}`
      )
      .then((r) => {
        console.log(JSON.parse(r.text));
        r.res.statusCode.should.equal(500);
        JSON.parse(r.text).statusText.should.be.a("string");
        JSON.parse(r.text).statusText.should.equal(
          `Error: Wallet address '${walletForSignatureVerification.classicAddress}' don't have the verification ID generated for it yet. Please start verification process by obtaining a verification ID before performing ownership verification check.`
        );
      });
  }).timeout(600000);

  it("Trying to verify NFT ownership with signature from wrong address", async () => {
    txJSON = {
      Account: myWallet.address,
      TransactionType: "AccountSet",
      Fee: "12",
      Sequence: 5,
      Domain: "6578616D706C652E636F6D",
      SetFlag: 5,
      MessageKey:
        "03AB40A0490F9B7ED8DF29D246BF2D6269820A0EE7742ACDD457BEA7C7D0931EDB",
      Memos: [
        {
          Memo: {
            MemoData: xrpl.convertStringToHex(testMemoId.toString()),
          },
        },
      ],
    };
    const signature = await myWallet.sign(txJSON);
    return requestWithSupertest
      .get(
        `/api/verifyOwnership?walletAddress=${testUser.classicAddress}&signature=${signature.tx_blob}&minter=raY33uxEbZFg7YS1ofFRioeENLsVdCgpC5&eventId=${testEvent.eventId}`
      )
      .then((r) => {
        console.log(JSON.parse(r.text));
        r.res.statusCode.should.equal(500);
        JSON.parse(r.text).statusText.should.be.a("string");
        JSON.parse(r.text).statusText.should.equal(
          `Error: Signature wasn't signed by provided wallet address '${testUser.classicAddress}'. Please provide correct signature and try again.`
        );
      });
  }).timeout(600000);

  it("Obtaining random ID for verification process", async () => {
    return requestWithSupertest
      .get(
        `/api/startVerification?walletAddress=${walletForSignatureVerification.classicAddress}`
      )
      .then(async (r) => {
        testMemoId = await JSON.parse(r.text).result;
        txJSON.Memos[0].Memo = {
          MemoData: xrpl.convertStringToHex(
            await JSON.parse(r.text).result.toString()
          ),
        };
        console.log(JSON.parse(r.text));
        r.res.statusCode.should.equal(200);
        JSON.parse(r.text).result.should.be.a("string");
      });
  }).timeout(600000);

  it("Trying to verify ownership with wrong signature", async () => {
    const signature = await myWallet.sign(txJSON);
    return requestWithSupertest
      .get(
        `/api/verifyOwnership?walletAddress=${walletForSignatureVerification.classicAddress}&signature=2280000000240000000268400000000000000C73210333C718C9CB716E0575454F4A343D46B284ED51151B9C7383524B82C10B262095744730450221009A4D99017F8FD6881D888047E2F9F90C068C09EC9308BC8526116B539D6DD44102207FAA7E8756F67FE7EE1A88884F120A00A8EC37E7D3E5ED3E02FEA7B1D97AA05581146C0994D3FCB140CAB36BAE9465137448883FA489&minter=raY33uxEbZFg7YS1ofFRioeENLsVdCgpC5&eventId=${testEvent.eventId}`
      )
      .then((r) => {
        console.log(JSON.parse(r.text));
        r.res.statusCode.should.equal(500);
        JSON.parse(r.text).statusText.should.be.a("string");
        JSON.parse(r.text).statusText.should.equal(
          "Error: Signature is not valid."
        );
      });
  }).timeout(600000);

  it("Trying to verify ownership with wrong signature Memo", async () => {
    const signature = await myWallet.sign(txWrongMemo);
    return requestWithSupertest
      .get(
        `/api/verifyOwnership?walletAddress=${walletForSignatureVerification.classicAddress}&signature=${signature.tx_blob}&minter=raY33uxEbZFg7YS1ofFRioeENLsVdCgpC5&eventId=${testEvent.eventId}`
      )
      .then((r) => {
        console.log(JSON.parse(r.text));
        r.res.statusCode.should.equal(500);
        JSON.parse(r.text).statusText.should.be.a("string");
        JSON.parse(r.text).statusText.should.equal(
          `Error: Memo '13' from signature does not match expected ID for the provided wallet address '${walletForSignatureVerification.classicAddress}'.`
        );
      });
  }).timeout(600000);

  it("Verifying ownership of NFT", async () => {
    const signature = await myWallet.sign(txJSON);
    return requestWithSupertest
      .get(
        `/api/verifyOwnership?walletAddress=${walletForSignatureVerification.classicAddress}&signature=${signature.tx_blob}&minter=raY33uxEbZFg7YS1ofFRioeENLsVdCgpC5&eventId=${testEvent.eventId}`
      )
      .then((r) => {
        console.log(JSON.parse(r.text));
        r.res.statusCode.should.equal(200);
        JSON.parse(r.text).result.should.be.a("boolean");
        JSON.parse(r.text).result.should.equal(true);
      });
  }).timeout(600000);
});
