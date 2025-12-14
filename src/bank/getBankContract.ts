// src/bank/getBankContract.ts
import { ethers } from "ethers";
import BankArtifact from "../abi/Bank.json";
import { NETWORKS } from "../core/networks";
import { getEthereum } from "../core/ethereum";

export async function getBankContract() {
  const ethereum = getEthereum();
  if (!ethereum) throw new Error("No wallet found");

  const provider = new ethers.providers.Web3Provider(ethereum as any);
  const signer = provider.getSigner();

  const address = NETWORKS.local.bank;
  if (!ethers.utils.isAddress(address)) {
    throw new Error("Invalid bank contract address");
  }

  const abi = (BankArtifact as any).abi;
  const contract = new ethers.Contract(address, abi, signer);

  // ✅ Phase2 统一上下文输出
  return { provider, signer, contract };
}