// react/getBankContract.ts
import { ethers } from "ethers";
import abi from "../solidity/Bank.json";
import { NETWORKS } from "./networks";   // ✅ 新增这一行

const contractAddress = NETWORKS.local.bank;  // ✅ 用 networks.ts 里的地址

export async function getBankContract() {
  if (!window.ethereum) {
    throw new Error("No wallet found");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  if (!ethers.isAddress(contractAddress)) {
    throw new Error("❌ Invalid contract address");
  }

  return new ethers.Contract(contractAddress, abi, signer);
}
