


import axios from 'axios'; 
import assert from 'assert';


//Mint NFT test
function test1() {

let body = {
  metadata: {
  date: "date", 
  location: "location", 
  description: "description", 
  image: "evt.target.result",
  file: "File.onload.evt.target.result"
  }
}


axios.post('http://localhost:5000/api/xummMint', body).then( (res) => { 
      
  try{
    
    assert(res.data);
    assert(res.data.refs.qr_png)

    console.log("==================================================")
    console.log("/api/xummMint: *res.data.qr_png* returned from rest API ")
    console.log("==================================================")

  }catch (err) {
    console.log(err)
  }


})
}


//Burn NFT test
function test2() {

  let body = {
    metadata: {
      NFTokenID: "000B00004675FF1C1138F5BFDAC09C53A90EF33E50F390CD16E5FC9C00000001",
    }
  }

  axios.post('http://localhost:5000/api/xummBurn', body).then( (res) => {


  assert(res.data);
  assert(res.data.refs.qr_png)

  console.log("==================================================")
  console.log("/api/xummBurn: *res.data.qr_png* returned from rest API ")
  console.log("==================================================")


  })
}  


//xummCreateSellOffer Test
function test3() {

  let body = {
    metadata: {
      NFTokenID: "000B00004675FF1C1138F5BFDAC09C53A90EF33E50F390CD16E5FC9C00000001",
      Amount: "2",
    }
  }

  axios.post('http://localhost:5000/api/xummCreateSellOffer', body).then( (res) => {


  assert(res.data);
  assert(res.data.refs.qr_png)

  console.log("==================================================")
  console.log("/api/xummCreateSellOffer *res.data.qr_png* returned from rest API ")
  console.log("==================================================")


  })
}  


function test4() {

  let body = {
    metadata: {
      Owner: "rfRZeyG8YfSmKPqdX6PVLFJ5bdPCraDAsA",
      NFTokenID: "000B00004675FF1C1138F5BFDAC09C53A90EF33E50F390CD16E5FC9C00000001",
      Amount: "2" 
    }
  }

  axios.post('http://localhost:5000/api/xummCreateBuyOffer', body).then( (res) => {


  assert(res.data);
  assert(res.data.refs.qr_png)

  console.log("==================================================")
  console.log("/api/xummCreateBuyOffer *res.data.qr_png* returned from rest API ")
  console.log("==================================================")


  })
}  

//xummAcceptOffer
function test5() {

  let body = {
    metadata: {
      NFTokenSellOffer: "000B00004675FF1C1138F5BFDAC09C53A90EF33E50F390CD16E5FC9C00000001" 
    }
  }

  axios.post('http://localhost:5000/api/xummAcceptOffer', body).then( (res) => {


  assert(res.data);
  assert(res.data.refs.qr_png)

  console.log("==================================================")
  console.log("/api/xummAcceptOffer *res.data.qr_png* returned from rest API ")
  console.log("==================================================")


  })
}

//xummCancelOffer
function test6() {

  let body = {
    metadata: {
      offerID: "000B00004675FF1C1138F5BFDAC09C53A90EF33E50F390CD16E5FC9C00000001" 
    }
  }

  axios.post('http://localhost:5000/api/xummCancelOffer', body).then( (res) => {


  assert(res.data);
  assert(res.data.refs.qr_png)

  console.log("==================================================")
  console.log("/api/xummCancelOffer *res.data.qr_png* returned from rest API ")
  console.log("==================================================")



  })
}



//createTickets
function test7() {

  let body = {
    metadata: {
      TicketCount: 2 
    }
  }

  axios.post('http://localhost:5000/api/createTickets', body).then( (res) => {


  assert(res.data);
  assert(res.data.refs.qr_png)

  console.log("==================================================")
  console.log("/api/createTickets *res.data.qr_png* returned from rest API ")
  console.log("==================================================")


  })
}


//mintTickets
function test8() {

  let body = {
    metadata: {
      account: "rhk5dvLzcQ9HywR4cTsms3TqunAb94bXmv"
    }
  }

  axios.post('http://localhost:5000/api/mintTickets', body).then( (res) => {

  assert(res.data);

  console.log("==================================================")
  console.log("/api/mintTickets  *res.data* returned from rest API ")
  console.log("==================================================")


  })
}




//ticket_info
function test9() {

  let body = {
    metadata: {
      account: "rhk5dvLzcQ9HywR4cTsms3TqunAb94bXmv"
    }
  }

  axios.post('http://localhost:5000/api/ticket_info', body).then( (res) => {

  
  assert(res.data);

  console.log("==================================================")
  console.log("/api/ticket_info *res.data* returned from rest API ")
  console.log("==================================================")


  })
}



//account_info
function test10() {

  let body = {
    metadata: {
      account: "rhk5dvLzcQ9HywR4cTsms3TqunAb94bXmv"
    }
  }

  axios.post('http://localhost:5000/api/account_info', body).then( (res) => {

  
  assert(res.data);

  console.log("==================================================")
  console.log("/api/account_info *res.data* returned from rest API ")
  console.log("==================================================")


  })
}


//getTokensFromLedger
function test11() {

  let body = {
    metadata: {
      account: "rhk5dvLzcQ9HywR4cTsms3TqunAb94bXmv"
    }
  }

  axios.post('http://localhost:5000/api/getTokensFromLedger', body).then( (res) => {

  
  assert(res.data);
 

  console.log("==================================================")
  console.log("/api/getTokensFromLedger *res.data* returned from rest API ")
  console.log("==================================================")


  })
}




console.log("==================================================")
console.log("Testing all endpoints in XummApi.js................ ")
console.log("==================================================")

test1();//Mint NFT test
test2();//Burn NFT test


test3();//xummCreateSellOffer
test4();//xummCreateBuyOffer

test5();//xummAcceptOffer
test6();//xummCancelOffer


test7();//createTickets
test8();//mintTickets


test9();//ticket_info
test10();//account_info

test11();//getTokensFromLedger

