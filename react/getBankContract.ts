import { ethers } from "ethers";
import abiJson from "../contracts/Bank.json";
import deployment from "../contracts/deployments.json";

const ABI = (abiJson as any).abi;

const ADDRESS: string =
  (deployment as any).Bank?.address || (deployment as any).Bank;

if (!ADDRESS) {
  console.warn("⚠️ deployments.json 未找到 Bank 合约地址");
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

let hasRequestedAccounts = false;

const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_CHAIN_HEX = "0xaa36a7";

export async function getBankContract() {
  if (!window.ethereum) {
    throw new Error("请先安装浏览器钱包（MetaMask / OKX 等）");
  }

  const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

  if (!hasRequestedAccounts) {
    try {
      await provider.send("eth_requestAccounts", []);
      hasRequestedAccounts = true;
    } catch {
      throw new Error("授权失败，请在钱包中允许本站访问账户");
    }
  }

  const network = await provider.getNetwork();
  if (network.chainId !== SEPOLIA_CHAIN_ID) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_HEX }],
      });
    } catch (err: any) {
      if (err.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: SEPOLIA_CHAIN_HEX,
              chainName: "Sepolia Testnet",
              rpcUrls: ["https://rpc.sepolia.org"],
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            },
          ],
        });
      } else {
        throw new Error("请先手动切到 Sepolia 网络");
      }
    }
  }

  const signer = provider.getSigner();
  const contract = new ethers.Contract(ADDRESS, ABI, signer);

  return { contract, provider, signer };
}