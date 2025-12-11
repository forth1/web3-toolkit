// react/getBalance.ts
import { ethers } from "ethers";
import { getBankContract } from "./getBankContract";

export async function getBankBalance(address: string): Promise<string> {
  // 1. 拿到 Bank 合约实例
  const contract = await getBankContract();

  // 2. 读取 public mapping：balances(address)
  const raw = await contract.balances(address);

  // 3. 转成 ETH 字符串
  return ethers.formatEther(raw);
}