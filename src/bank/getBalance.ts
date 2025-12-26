// src/bank/getBalance.ts
// 作用：读取 Bank 合约余额（优先 getBalance()，否则读 balance()）并格式化成 ETH 字符串
// 兼容：ethers v5（使用 ethers.utils.formatEther）

import { ethers } from "ethers";
import { getBankContract } from "./getBankContract";

export async function getBalance(): Promise<string> {
  const { contract } = await getBankContract();

  // ✅ 兼容不同 Bank 合约接口：getBalance() / balance()
  const raw =
    (await contract.getBalance?.()) ??
    (await contract.balance?.());

  // ✅ ethers v5：formatEther 在 ethers.utils 下面
  return ethers.utils.formatEther(raw);
}