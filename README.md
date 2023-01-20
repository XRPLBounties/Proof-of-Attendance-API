# Proof-of-Attendance
Community Event Management Tool: Build a library to provide infrastructure that allows event organizers to mint and distribute Attendance NFTs on the XRP Ledger.

XProof-of-Attendance-Infrastructure is a MERN stack application that contains functionality to allow event organizers to mint and distribute Attendance NFTs on the XRP Ledger. The core parts of this application consist of a React frontend, Express backend, Rest API (nftRoutes.js and xummapi.js), and XrplNFTHelper.js. 

Please note, mongo has been disconnected. Any db solution can replace it but isn't needed at this point. All metadata storage for the NFT's is currently stored locally is JSON object files on the pinata ipfs website.

In order to facilitate storing json files with a public uri and continue using the site without the need for a db solution XummApi.js has was introduced. It consists of 11 REST API endpoints and will allow the developer to build on top a frontend and user db solution that utilizes NFT's on the XRPL.

# Installing

Simply do a npm install in each folder that contains a package.json file.

### `Frontend2.0/npm install`
### `./npm install`
