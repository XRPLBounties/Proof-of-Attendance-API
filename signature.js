const xrpl = require("xrpl");

/**
 * Run this file locally with 2 arguments just like the example below to generate signed tx blob
 * The first argument is seed for the user wallet
 * The second argument should be verification ID returned from `api/startVerification` endpoint
 * node .\signature.js sEdVMJSLjuTAjaSeeZ6TEkpUWuTS83j PPrnp3O4FI3Z5VCnMvvsMwzjMCmrtZnUNqWQEqkGXIuGJ7xzpCdhUql3X9SwlP1d1unotJX8FHCMJTgbYUQfa7b1nSVb7FY9wSrWH3NxQIF9py1MXfOGGiZyjM6S4WuxhxK1Ru499u9jhnZ3vhifyRPVYFytDD2YUsjqG7F3ojWkVC4VoOEHP4uuztfb2k0ZueCIP1tfbgoAXEuU5DxoSLAWx9kP3b7nKuOqV6lvlbKWGzCI5xE1YG5ExTkowk0M
 */

let testMemoId;
let myWallet;

if (process && typeof process.exit == "function") {
  testMemoId = process.argv.length > 3 ? process.argv[3] : "";
  myWallet =
    process.argv.length > 2 ? xrpl.Wallet.fromSeed(process.argv[2]) : "";
}

let walletForSignatureVerification = {
  publicKey:
    "ED57D41105FC480545763677D2100C8949324A97811FE5CB45594B5E73991BBF92",
  privateKey:
    "EDE60F3996E5A0855FEF0C1E31A894D5085294A12D364FB11421F37B7683A1F6B2",
  classicAddress: "raY33uxEbZFg7YS1ofFRioeENLsVdCgpC5",
  seed: "sEdVMJSLjuTAjaSeeZ6TEkpUWuTS83j",
};

const txJSON = {
  Account: myWallet.classicAddress,
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
        MemoData: xrpl.convertStringToHex(testMemoId),
      },
    },
  ],
};

const signature = myWallet.sign(txJSON);
console.log("signature ", signature.tx_blob);
