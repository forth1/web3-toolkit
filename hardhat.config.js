require("@nomicfoundation/hardhat-ethers");

module.exports = {
  solidity: "0.8.20",
  paths: {
    sources: "./solidity",
    cache: "./hardhat/cache",
    artifacts: "./hardhat/artifacts"
  }
};