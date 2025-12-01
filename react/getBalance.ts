// react/getBalance.ts
import { ethers } from "ethers";

export async function getBalance(address: string) {
  if (!window.ethereum) throw new Error("No wallet found");

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const balanceWei = await provider.getBalance(address);

  return ethers.utils.formatEther(balanceWei); // 返回 ETH 字符串
}