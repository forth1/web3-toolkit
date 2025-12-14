// src/core/ethereum.ts
import { ethers } from "ethers";

export type Ethereumish = {
  request?: (args: { method: string; params?: any[] | object }) => Promise<any>;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (event: string, handler: (...args: any[]) => void) => void;
};

export function getEthereum(): Ethereumish | undefined {
  // 兼容浏览器 / Node 构建环境
  return (globalThis as any)?.ethereum as Ethereumish | undefined;
}

export function requireEthereum(): Ethereumish {
  const eth = getEthereum();
  if (!eth) throw new Error("No wallet found (window.ethereum is missing)");
  return eth;
}

export function getProvider(): ethers.providers.Web3Provider {
  const eth = requireEthereum();
  return new ethers.providers.Web3Provider(eth as any);
}

export function getSigner(): ethers.Signer {
  return getProvider().getSigner();
}