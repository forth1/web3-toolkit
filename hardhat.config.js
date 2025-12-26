import { defineConfig } from "hardhat/config";

import hardhatViem from "@nomicfoundation/hardhat-viem";

export default defineConfig({
  plugins: [hardhatViem],

  solidity: {
    version: "0.8.20",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },

  paths: {
    sources: "./hardhat/contracts",
    artifacts: "./hardhat/artifacts",
    cache: "./hardhat/cache",
    tests: "./hardhat/test",
  },

  networks: {
    localhost: { url: "http://127.0.0.1:8545" },
  },
});