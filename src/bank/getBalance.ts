// src/bank/getBalance.ts
import { ethers } from "ethers";
import { getBankContract } from "./getBankContract";

export async function getBalance(address: string): Promise<string> {
  const { contract } = await getBankContract();

  // Bank.sol 如果是 `mapping(address => uint256) public balances;`
  // 那就会有自动生成的 balances(address) getter
  const bal = await (contract as any).balances(address);

  return ethers.utils.formatEther(bal);
}