// react/getBankContract.ts
import { ethers } from "ethers";
import abi from "../solidity/Bank.json";

const contractAddress = "你的真实部署地址";

export async function getBankContract() {
  if (!window.ethereum) throw new Error("No wallet found");

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();

  if (!ethers.utils.isAddress(contractAddress)) {
    throw new Error("❌ Invalid contract address");
  }

  // 自动检测是否部署
  const code = await provider.getCode(contractAddress);
  if (code === "0x") {
    throw new Error("❌ Contract not deployed at this address");
  }

  return new ethers.Contract(contractAddress, abi, signer);
}