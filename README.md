# Proof-of-Attendance
Community Event Management Tool: Build a library to provide infrastructure that allows event organizers to mint and distribute Attendance NFTs on the XRP Ledger.

XProof-of-Attendance-Infrastructure is a MERN stack application that contains functionality to allow event organizers to mint and distribute Attendance NFTs on the XRP Ledger. The core parts of this application consist of a React frontend, Express backend, Rest API (nftRoutes.js and xummapi.js), and XrplNFTHelper.js. 

Please note, mongo has been disconnected. Any db solution can replace it but isn't needed at this point. All metadata storage for the NFT's is currently stored locally is JSON object files on the pinata ipfs website.

In order to facilitate storing json files with a public uri and continue using the site without the need for a db solution XummApi.js has was introduced. It consists of 11 REST API endpoints and will allow the developer to build on top a frontend and user db solution that utilizes NFT's on the XRPL.

# Getting started
You will need to edit the xummapi.js file before being able to successfully run the app. You will need api account and key information for Pinata and the Xumm app. Additionally it is recommended that you have an XUMM wallet / app installed. More than one wallet address can be useful when testing.

Please visit these sites to obtain api key info:
'https://xumm.readme.io/'
'https://www.pinata.cloud/'

After api info has been obtained edit the Xummapi.js file with the proper information.

# Installing

Simply do a npm install in each folder that contains a package.json file.

### `Frontend2.0/npm install`
### `./npm install`


# Running

Run the backend followed by running the frontend if necessary. If just testing the frontend UX/UI then no need to run backend.

### `./npm run`
### `Frontend2.0/npm run`

# Testing
All XRPL functionality can be done live through the XUMM wallet app. Available functionality is listed at the bottom of /tests/App.test.js. The functionality is given by the name of the backend route. Backend route api rest data details can be found in Xummapi.js within the comments. All parameters and data structure requirements are listed for each POST or GET route. Additionally the data that is returned is listed. In most cases an XUMM payload is returned that contains a qr code png file url. This url is needed to be scanned by the XUMM app wallet owner. In some cases certain transactions can only be done by authorized users.

In order to run a test of all backend api routes please use the following command:
### `npm test`

This will run 'node /tests/App.test.js'

# Test reference (examples of proper post/get body object for each route):

test1()
Mint NFT test

test2()
Burn NFT test

test3()
xummCreateSellOffer

test4()
xummCreateBuyOffer

test5()
xummAcceptOffer

test6()
xummCancelOffer

test7()
createTickets

test8()
mintTickets

test9()
ticket_info

test10()
account_info

test11()
getTokensFromLedger







