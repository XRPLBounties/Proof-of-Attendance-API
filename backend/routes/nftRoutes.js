import { getUsers, getUserById } from "../controllers/userController.js";
import express from 'express'

import XrplNFTHelper from './XrplNFTHelper.js';
import xrpl from "xrpl";

import fs from "fs";
import path from 'path';

const router = express.Router()

        
// express router method to create an Event NFT
//RETURNS: array NFTokenID strings OR single NFTokenID string if successful
router.route('/mintNFT').get((req, res) => {

    let body = JSON.parse(req.headers.body)
    
let memo = {
            NFTokenID: "",
            date: body.date,
            location: body.location,
            description: body.description,
            image: body.image,
            numberOfTokens: parseInt(body.numberOfTokens),
            offer: body.offer,
            title: body.title,
            time: body.time,
            qrCode: true,
            uniqueTaxon: true 

}


    console.log("minting + " + memo.numberOfTokens)

    const nftManager = new XrplNFTHelper({TransactionType: "NFTokenMint", 
                            Account: body.account, 
                            Secret:  body.secret,
                            URI: xrpl.convertStringToHex("www.testing.com"), 
                            Flags: parseInt(11), 
                            NFTokenTaxon: 0x2600,
                            Memos: memo });



          
    
    if(parseInt(memo.numberOfTokens) > 1){

      
      nftManager.batchX().then( (result) => {

        //RETURNS: array of NFTokenID's
        res.send(result)

      })
    }else{

      
      nftManager.mintToken().then( (result) => {
        
        memo.NFTokenID = result;
        console.log("storing to file")

        //store memo in file with NFTokenID as reference
        let data = JSON.stringify(memo);
        fs.writeFileSync(`./nfts/${memo.NFTokenID}`, data);
        
      
        //RETURNS:  new NFTokenID string
        res.send(result)
    })
   
    

  }
})

/* express router method to burn specified Event token
   Required body params: 
   -Account: body.account, 
   -Secret:  body.secret,
   -NFTokenID: body.nftTokenID

   Returns:
   -String (Transaction Result)
*/
router.route('/burnNFT').get((req, res) => {

    //parse an string object.
    let body = JSON.parse(req.headers.body)
    

    const nftManager = new XrplNFTHelper({TransactionType: "NFTokenBurn", 
    Account: body.account, 
    Secret:  body.secret,
    NFTokenID: body.nftTokenID});
    
  nftManager.burnNFT().then( (result) => { 

    //remove corresponding metadata from storage
    var filePath = `./nfts/${body.nftTokenID}`; 
    fs.unlinkSync(filePath);
    
    //string (transaction result)
    res.send(result)

  })
})



/*Burn all NFTs in the account
Params (required): 
  -Account: body.account, 
  -Secret:  body.secret,

  Returns:
  Array of NFToken's that were removed

*/
router.route('/burnAllNFT').get((req, res) => {

    let body = JSON.parse(req.headers.body)
  

  const nftManager = new XrplNFTHelper({TransactionType: "NFTokenBurn", 
  Account: body.account, 
  Secret:  body.secret,});

  nftManager.burnAllNFT().then( (result) => {
      
    console.log(result)
    res.send(result)
       
  });

})




/* Get all NFT's from storage.

  Returns:
  Array of NFTokenID strings that currently exist in metadata storage

*/
router.route('/getTokens').get((req, res) => {

  
    const jsonsInDir = fs.readdirSync('./nfts/')
    let str = JSON.stringify(jsonsInDir);
    console.log(str)
    res.send(str);
  


})


/* Get all NFT's from ledger.

  Returns:
  Array of NFTokenID strings that currently exist on the ledger

*/
router.route('/getTokensFromLedger').get((req, res) => {


  
  const nftManager = new XrplNFTHelper({ Account: "rfRZeyG8YfSmKPqdX6PVLFJ5bdPCraDAsA"
  });

  nftManager.getTokensFromLedger().then( (result) => {
  
    res.send(result)

  })
})


/* Get all metadata details

  Params (required):
  String NFTokenID

  Returns:
  Stringified JSON object
*/
router.route('/getData').get((req, res) => { 




})


router.route('/xummPayload').get((req,res) => {

  console.log("xummPayload route")

  let memo = []


  let payload = {
                            TransactionType: "NFTokenMint", 
                            URI: xrpl.convertStringToHex("ww.constant.com"), 
                            Flags: parseInt(11), 
                            NFTokenTaxon: 0x2600,
                            Memos: memo

                 }
    const nftHelper = new XrplNFTHelper({Secret: "ssTkdDoL3i6SGoDjFwjtkmFpM3SAi", 
    Account: "rLu7G9VDPpvFoqQJRpZZQc2QNDbUhxafJd"});


          nftHelper.xummCall(payload).then(result => { 

            console.log(result)

           
            res.send(result)
          })
})


// Account: "rLu7G9VDPpvFoqQJRpZZQc2QNDbUhxafJd", 
//Secret:  "ssTkdDoL3i6SGoDjFwjtkmFpM3SAi"


export default router

