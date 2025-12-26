import { ethers } from "ethers";
import { getERC20Contract } from "./getERC20Contract";

/**
 * Get ERC20 token balance (human readable string)
 * - Reads decimals() and balanceOf(user)
 * - Returns formatted string (e.g., "1.2345")
 */
export async function getTokenBalance(params: {
  tokenAddress: string;
  userAddress: string;
  // optional: override decimals if you already know it (saves 1 RPC call)
  decimals?: number;
}): Promise<{
  raw: string;        // raw balance (wei-like)
  decimals: number;   // token decimals
  formatted: string;  // human readable
}> {
  const { tokenAddress, userAddress } = params;

  if (!ethers.utils.isAddress(tokenAddress)) {
    throw new Error(`Invalid tokenAddress: ${tokenAddress}`);
  }
  if (!ethers.utils.isAddress(userAddress)) {
    throw new Error(`Invalid userAddress: ${userAddress}`);
  }

  // read-only is enough for balance
  const { contract } = getERC20Contract(tokenAddress, false);

  const decimals =
    typeof params.decimals === "number"
      ? params.decimals
      : Number(await contract.decimals());

  const bn: ethers.BigNumber = await contract.balanceOf(userAddress);

  const raw = bn.toString();
  const formatted = ethers.utils.formatUnits(bn, decimals);

  return { raw, decimals, formatted };
}