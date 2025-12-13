module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  paths: {
    sources: "./hardhat/contracts",
    artifacts: "./hardhat/artifacts",
    cache: "./hardhat/cache",
    tests: "./hardhat/test",
  },
};