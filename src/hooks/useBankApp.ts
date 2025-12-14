// src/bank/getBalance.ts
import { ethers } from "ethers";
import { getBankContract } from "../bank/getBankContract";

export async function getBankBalance(address: string): Promise<string> {
  const { contract } = await getBankContract(); // ✅ 注意解构 contract
  const bal = await (contract as any).balances(address);
  return ethers.utils.formatEther(bal);
}