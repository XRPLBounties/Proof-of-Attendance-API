require("dotenv").config();

/**
 * ERROR CODES
 */
const ERR_NOT_FOUND = "Requested resource is missing"; //  Returned when requested resource was not found
const ERR_PARAMS = "Incorrect params were provided"; // Returned when incorrect params were provided or when some required params were null
const ERR_IPFS = "Can't upload data to IPFS"; // Returned if there was problem with IPFS upload
const ERR_XRPL = "Problem with XRPL connection"; // Returned if there was problem connecting to XRPL or querrying required data from it
const ERR_ATTENDIFY = "Attendify internal error"; // Custom unexpected error related to Attendify library

const truncateStr = (str, n = 6) => {
  if (!str) return "";
  return str.length > n
    ? str.substr(0, n - 1) + "..." + str.substr(str.length - n, str.length - 1)
    : str;
};

/**
 * Turns ASCII string into hex string
 * @param {string} str - ASCII string
 * @returns {string} arr1 - hex string
 */
const ascii_to_hexa = (str) => {
  var arr1 = [];
  for (var n = 0, l = str.length; n < l; n++) {
    var hex = Number(str.charCodeAt(n)).toString(16);
    arr1.push(hex);
  }
  return arr1.join("");
};

/**
 * Uploads provided data to IPFS
 * @param {object} data - Metadata object
 * @returns {string} path - hash of file uploaded to IPFS
 */
const postToIPFS = async (data) => {
  const { create } = await import("ipfs-http-client");
  let ipfs;
  let path = "";
  try {
    const authorization =
      "Basic " + btoa(process.env.INFURA_ID + ":" + process.env.INFURA_SECRET);
    ipfs = create({
      url: "https://infura-ipfs.io:5001/api/v0",
      headers: {
        authorization,
      },
    });
    const result = await ipfs.add(data);
    path = `https://ipfs.io/ipfs/${result.path}`;
    //path = `ipfs://${result.path}`;
  } catch (error) {
    console.error("IPFS error ", error);
    return error;
  }
  return path;
};

module.exports = {
  ascii_to_hexa,
  postToIPFS,
  ERR_ATTENDIFY,
  ERR_IPFS,
  ERR_NOT_FOUND,
  ERR_PARAMS,
  ERR_XRPL,
};
