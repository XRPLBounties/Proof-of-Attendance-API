import express from 'express'
import xrpl from "xrpl";
import fetch from 'node-fetch'
import axios from 'axios'
import {create} from 'ipfs-http-client';
import XrplNFTHelper from './XrplNFTHelper.js';
import XummSdk from 'xumm-sdk';


const xummApi = ''
const xummSecret = ''

const pinataApiKey = ''
const pinataSecretApiKey = ''

const tempAddr = "rfRZeyG8YfSmKPqdX6PVLFJ5bdPCraDAsA"

const minterAddress = "rhk5dvLzcQ9HywR4cTsms3TqunAb94bXmv"
const minterKey = ""

const sdk = new XummSdk.XummSdk(xummApi,xummSecret)

const router = express.Router()




/*
* Call to the XUMM sdk. Requires properly constructed payload 
* and returns data for the user to interact with (.png QR code url).
*
* @params: payload object. {TransactionType: "CreateTicket",...}
* @Returns: XUMM data object. data.refs.qr_png contains qr code information for user to scan with app.
*/
const xummCall = async (payload) => {

    const data =  await sdk.payload.create(payload)
    return data
}

/*
* Gets the ticket objects from an account and mints all tickets it finds on the account passed.
*
* @params: Post with a body object containing metadata.account. String value with live r-address. 
* Example: req.body.metadata.account -> {metadata: {account: "rfRZeyG8YfSmKPqdX6PVLFJ5bdPCraDAsA"}  }
* 
* @Returns: Updated object with ann array of NFT's for the account. 
*
*/
router.route('/mintTickets').post( (req,res) => { 

  const nftManager = new XrplNFTHelper({Account: req.body.metadata.account})
  nftManager.getTicketInfo().then( tickets => {
  nftManager.mintTickets(tickets,minterKey).then(nfts => { 

         res.send(nfts)
      })
    })
})

/*
* Creates any number of tickets passed. These tickets can later be used to mint in batches greater than 1 via /mintTickets.
*
* @params: Post with a body object containing metadata.TicketCount. Integer value greater than 1. 
* Example: req.body.metadata.TicketCount -> {metadata: {TicketCount: 5 }  }
*
* @Returns: XUMM data object. response.data.refs.qr_png contains qr code information for user to scan with app. 
*/
router.route('/createTickets').post((req,res) => {
 
  let payload = {
    TransactionType: "TicketCreate",
    TicketCount: req.body.metadata.TicketCount
  }

  try {
    xummCall(payload).then( (xummInfo) => {
        
        let response = JSON.stringify(xummInfo); 
        res.send(response);
    
    })
  } catch (error) {
    console.log(error)
  }
})



/*
* Cancels a single existing offer. 
*
* @params: Post with a body object containing metadata.OfferID. String value with offer ID. 
* Example: req.body.metadata.OfferID -> {metadata: {OfferId: "enter-offerid-value" }  }
*
* @Returns: XUMM data object. response.data.refs.qr_png contains qr code information for user to scan with app.
*/
router.route('/xummCancelOffer').post((req,res) => {
  
  let offers = []
  offers.push(req.body.metadata.offerID)
 
 let payload = {
                  TransactionType: "NFTokenCancelOffer",
                  NFTokenOffers: offers
               }

                try {

                  let result = xummCall(payload).then( (xummInfo) => {
                      
                      let response = JSON.stringify(xummInfo); 
                      res.send(response);
                  
                  })    
                } catch (error) {
                  console.log(error)
                }



})




/*
* Accepts an offer. 
*
* @params: Post with a body object containing metadata.NFTokenSellOffer. String value with offer ID. 
* Example: req.body.metadata.NFTokenSellOffer -> {metadata: {NFTokenSellOffer: "enter-offerid-value" }  }
*
* @Returns: XUMM data object. response.data.refs.qr_png contains qr code information for user to scan with app.
*/
router.route('/xummAcceptOffer').post((req,res) => {

  let payload = {
                  TransactionType: "NFTokenAcceptOffer",
                  NFTokenSellOffer: req.body.metadata.NFTokenSellOffer,
                }

                try {
                
                  xummCall(payload).then( (xummInfo) => {
                      
                      let response = JSON.stringify(xummInfo);         
                      res.send(response);

                  }) 
                } catch (error) {
                  console.log(error)
                }
})



/*
* Creates a buy offer for a specified NFT token. 
*
* @params: Post with a body object containing Owner,NFTokenID, and Amount. All string values. 
* Example: req.body.metadata -> {metadata: {
                                                  Owner: "owner r-address",
                                                  NFTokenID: "token id value",
                                                  Amount: "Amount in XRP"
                                                }
                                              }
*
* @Returns: XUMM data object. response.data.refs.qr_png contains qr code information for user to scan with app.
*/
router.route('/xummCreateBuyOffer').post((req,res) => {
 
  let payload = {
                  TransactionType: "NFTokenCreateOffer",
                  Owner: req.body.metadata.owner,
                  NFTokenID: req.body.metadata.NFTokenID,
                  Amount: req.body.metadata.Amount       
                }

              try {

                  xummCall(payload).then( (xummInfo) => {
                      let response = JSON.stringify(xummInfo); 
                      res.send(response);
                  })
                } catch (error) {
                  console.log(error)
                }
})




/*
* Creates a Sell offer for a specified NFT token. 
*
* @params: Post with a body object containing NFTokenID, and Amount. All string values. 
* Example: req.body.metadata.NFTokenSellOffer -> {metadata: {
                                                  NFTokenID: "token id value",
                                                  Amount: "Amount in XRP"
                                                }
                                              }
*
* @Returns: XUMM data object. response.data.refs.qr_png contains qr code information for user to scan with app.
*/
router.route('/xummCreateSellOffer').post((req,res) => {

    let payload = {
                    TransactionType: "NFTokenCreateOffer",
                    NFTokenID: req.body.metadata.NFTokenID,
                    Amount: req.body.metadata.Amount,
                    Flags: 1
                }


                try {
                  xummCall(payload).then( (xummInfo) => {
                      
                        let response = JSON.stringify(xummInfo); 
                        res.send(response);
                    
                    })             
                  } catch (error) {
                    console.log(error)
                  }

})



/*
* Mints single NFT. Stored metadata at pinata ipfs storage solution. 
*
* @params: Post with a body object containing metadata that should be linked to NFT. 
* Example: req.body.metadata -> {metadata: {
                                                  anydata: "as needed"
                                                  imageFile: "string value"
                                                  location: "string"
                                                  "description": "string"
                                                }
                                              }
*
* @Returns: XUMM data object. response.data.refs.qr_png contains qr code information for user to scan with app.
*
*
* PLEASE NOTE: Memos array is successfully being passed with the payload but XUMM app is not displaying attached memo. Memo seems
               to be getting lost during transaction.
*/
router.route('/xummMint').post((req,res) => {

    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;

    axios.post(url, req.body,
        {
            headers: {
                'Content-Type': `application/json; boundary= ${req.body.metadata._boundary}`,
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretApiKey
            }
        }
    ).then(function (ipfsData) {    

    let payload = {
                              TransactionType: "NFTokenMint", 
                              URI: xrpl.convertStringToHex(`https://gateway.pinata.cloud/ipfs/${ipfsData.data.IpfsHash}`), 
                              Flags: parseInt(11), 
                              NFTokenTaxon: 1111,
                              Memos:  [{
                                    MemoType:
                                    xrpl.convertStringToHex("https://jom.live/5555"),
                                    MemoData: xrpl.convertStringToHex("NFT")
                                }
                            ]
                   }

                   try {

                    xummCall(payload).then( (xummInfo) => {
                        
                        let response = JSON.stringify(xummInfo);         
                        res.end(response);
                    
                    })
                                    
                  } catch (error) {
                    console.log(error)
                  }

    }).catch(function (error) {
        console.log(error)
    });  
    
    
  })



  /*
* Burn a specified NFT. 
*
* @params: Post with a body object containing NFTokenID,. A String value. 
* Example: req.body.metadata.NFTokenSellOffer -> {metadata: {
                                                  NFTokenID: "token id value"
                                                }
                                              }
*
* @Returns: XUMM data object. response.data.refs.qr_png contains qr code information for user to scan with app.
*/
  router.route('/xummBurn').post((req, res) => {

    let payload = { 
        TransactionType: "NFTokenBurn",
        NFTokenID: req.body.metadata.NFTokenID,
    }

    try {

        xummCall(payload).then( (xummInfo) => {
            
            let response = JSON.stringify(xummInfo);   
            res.send(response);
        
        })        
      } catch (error) {
       console.log(error)
      }

  })




/*
* Get all NFT's from ledger for specified account.
*
* @params: Post with a body object containing metadata.Account. String value with proper r-address. 
* Example: req.body.metadata.Account -> {metadata: {Account: "r-address" }  }
*
* @Returns: Array of NFT's. 
*/
router.route('/getTokensFromLedger').post((req, res) => {

    const nftManager = new XrplNFTHelper({Account: req.body.metadata.account});
    nftManager.getTokensFromLedger().then( (result) => {
      res.send(result);
    })
  })



  
/*
* Get payload info. Returns results containing current status of payload - whether or not the user has signed the transaction.
*
* @params: Post with a body object containing metadata.uuid. String value with valid uuid number. 
* Example: req.body.metadata.uuid -> {metadata: {uuid: "uuid value" }  }
*
* @Returns: JSON object containing the results. 
*/
  router.route('/getPayloadInfo').get( (req,res) => { 
    
const url = `https://xumm.app/api/v1/platform/payload/${req.body.metadata.uuid}`;
const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    'X-API-Key': xummApi,
    'X-API-Secret': xummSecret
  }
};

fetch(url, options)
  .then(res => res.json())
  .then(json => res.send(json))
  .catch(err => console.error('error:' + err));

})



/*
* Returns account info.
*
* @params: Post with a body object containing metadata.account. String value with r-address. 
* Example: req.body.metadata.account -> {metadata: {account: "r-address value" }  }
*
* @Returns: JSON object containing the results. 
*/
router.route('/account_info').post( (req,res) => { 

  const nftManager = new XrplNFTHelper({Account: req.body.metadata.account})
  nftManager.acctInfo().then(info => {    
    let response = JSON.stringify(info); 
    res.send(response);

  })
})




/*
* Returns details about details for the specified account.
*
* @params: Post with a body object containing metadata.account. String value with r-address. 
* Example: req.body.metadata.account -> {metadata: {account: "r-address value" }  }
*
* @Returns: JSON object containing the results. 
*/
router.route('/ticket_info').post( (req,res) => { 


  const nftManager = new XrplNFTHelper({Account: req.body.metadata.account})
  nftManager.getTicketInfo().then( info => {
   
    let response = JSON.stringify(info);  
    res.send(response);

  })

})

  
  export default router

