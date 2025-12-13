import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";

export interface WalletState {
  account: string | null;
  shortAccount: string;
  balance: string;
  loading: boolean;
  error: string | null;
}

export interface UseWalletResult extends WalletState {
  connect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  disconnect: () => void;
}

function shortAddr(addr: string | null) {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export function useWallet(): UseWalletResult {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ⭐ 唯一合法的 ethereum 来源
  const getEthereum = useCallback(() => {
    return (window as any).ethereum as any;
  }, []);

  const getProvider = useCallback(() => {
    const ethereum = getEthereum();
    if (!ethereum) throw new Error("No wallet found");
    return new ethers.providers.Web3Provider(ethereum);
  }, [getEthereum]);

  const refreshBalance = useCallback(async () => {
    if (!account) return;
    const provider = getProvider();
    const bal = await provider.getBalance(account);
    setBalance(ethers.utils.formatEther(bal));
  }, [account, getProvider]);

  const connect = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const ethereum = getEthereum();
      if (!ethereum) throw new Error("No wallet found");

      const provider = new ethers.providers.Web3Provider(ethereum);
      await provider.send("eth_requestAccounts", []);

      const signer = provider.getSigner();
      const addr = await signer.getAddress();
      setAccount(addr);

      const bal = await provider.getBalance(addr);
      setBalance(ethers.utils.formatEther(bal));
    } catch (e: any) {
      setError(e?.message ?? "Connect failed");
    } finally {
      setLoading(false);
    }
  }, [getEthereum]);

  const disconnect = useCallback(() => {
    setAccount(null);
    setBalance("0");
    setError(null);
  }, []);

  useEffect(() => {
    const ethereum = getEthereum();
    if (!ethereum) return;

    const onAccountsChanged = (accs: string[]) => {
      const a = accs?.[0] ?? null;
      setAccount(a);
      if (!a) setBalance("0");
    };

    const onChainChanged = () => {
      refreshBalance().catch(() => {});
    };

    ethereum.on?.("accountsChanged", onAccountsChanged);
    ethereum.on?.("chainChanged", onChainChanged);

    return () => {
      ethereum.removeListener?.("accountsChanged", onAccountsChanged);
      ethereum.removeListener?.("chainChanged", onChainChanged);
    };
  }, [getEthereum, refreshBalance]);

  return {
    account,
    shortAccount: shortAddr(account),
    balance,
    loading,
    error,
    connect,
    refreshBalance,
    disconnect,
  };
}