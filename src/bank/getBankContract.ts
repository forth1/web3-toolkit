import { ethers } from "ethers";
import BankArtifact from "../abi/Bank.json";
import { NETWORKS } from "../utils/networks";

export async function getBankContract() {
  const ethereum = (window as any).ethereum;
  if (!ethereum) {
    throw new Error("No wallet found");
  }

  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();

  const address = NETWORKS.local.bank;
  if (!ethers.utils.isAddress(address)) {
    throw new Error("Invalid bank contract address");
  }

  // ⚠️ 关键：只取 abi
  const abi = (BankArtifact as any).abi;

  return new ethers.Contract(address, abi, signer);
}