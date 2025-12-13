import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { getEthereum } from "../core/ethereum";

export function useWallet() {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProvider = useCallback(() => {
    const ethereum = getEthereum();
    if (!ethereum) throw new Error("No wallet found");
    return new ethers.providers.Web3Provider(ethereum as any);
  }, []);

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

      const provider = getProvider();
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
  }, [getProvider]);

  const disconnect = useCallback(() => {
    setAccount(null);
    setBalance("0");
    setError(null);
  }, []);

  useEffect(() => {
    const ethereum = getEthereum();
    if (!ethereum?.on) return;

    const onAccountsChanged = (accs: string[]) => {
      const a = accs?.[0] ?? null;
      setAccount(a);
      if (!a) setBalance("0");
    };

    const onChainChanged = () => {
      refreshBalance().catch(() => {});
    };

    ethereum.on("accountsChanged", onAccountsChanged);
    ethereum.on("chainChanged", onChainChanged);

    return () => {
      ethereum.removeListener?.("accountsChanged", onAccountsChanged);
      ethereum.removeListener?.("chainChanged", onChainChanged);
    };
  }, [refreshBalance]);

  const shortAccount = account ? account.slice(0, 6) + "..." + account.slice(-4) : "";

  return {
    account,
    shortAccount,
    balance,
    loading,
    error,
    connect,
    refreshBalance,
    disconnect,
  };
}