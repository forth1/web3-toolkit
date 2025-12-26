// hardhat/scripts/check-token.js
// 作用：直接读链上 MyToken 的 name / symbol / decimals / balanceOf（ESM 兼容 + 兼容 abi/artifact 两种 JSON）

import { createPublicClient, getContract, http } from "viem";
import { hardhat } from "viem/chains";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// 你的 MyToken.json 可能是：ABI数组 或 { abi: [...] } 的 artifact
const tokenJson = require("../../src/abi/MyToken.json");
const tokenAbi = Array.isArray(tokenJson) ? tokenJson : tokenJson.abi;

if (!Array.isArray(tokenAbi)) {
  throw new Error(
    `Invalid ABI format. Expected ABI array or {abi: ABI[]}. Got keys: ${Object.keys(
      tokenJson || {}
    ).join(", ")}`
  );
}

const TOKEN_ADDR = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const USER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // hardhat 0号账户

async function main() {
  const client = createPublicClient({
    chain: hardhat,
    transport: http("http://127.0.0.1:8545"),
  });

  // 1) 先确认地址上有没有合约 bytecode
  const code = await client.getBytecode({ address: TOKEN_ADDR });
  console.log("code exists:", !!code);

  // 2) 合约实例
  const token = getContract({
    address: TOKEN_ADDR,
    abi: tokenAbi,
    client,
  });

  // 3) 读数据
  const [name, symbol, decimals, bal] = await Promise.all([
    token.read.name(),
    token.read.symbol(),
    token.read.decimals(),
    token.read.balanceOf([USER]),
  ]);

  console.log({
    name,
    symbol,
    decimals: Number(decimals),
    balanceOf: bal.toString(),
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});