// react/getBalance.ts
import { ethers } from "ethers";
import { getBankContract } from "./getBankContract";

export async function getBankBalance(address: string): Promise<string> {
  const contract = await getBankContract();
  const bal = await contract.balances(address); // 或 contract.getBalance(address) 看你合约方法名
  return ethers.utils.formatEther(bal);
}