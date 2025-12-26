import { ethers } from "ethers";
import MyToken from "../abi/MyToken.json";
import { getEthereum } from "../core/ethereum";

export function getERC20Contract(
  tokenAddress: string,
  withSigner = true
) {
  const ethereum = getEthereum();
  if (!ethereum) {
    throw new Error("No ethereum provider found");
  }

  const provider = new ethers.providers.Web3Provider(ethereum);

  const signerOrProvider = withSigner
    ? provider.getSigner()
    : provider;

  const contract = new ethers.Contract(
    tokenAddress,
    MyToken.abi,
    signerOrProvider
  );

  return {
    provider,
    signer: withSigner ? signerOrProvider : null,
    contract,
  };
}