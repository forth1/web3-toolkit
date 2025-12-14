// src/hooks/useWallet.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { getEthereum, type Ethereumish } from "../core/ethereum";

export interface WalletState {
  account: string | null;
  shortAccount: string;
  balance: string; // ETH string
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

function getWeb3Provider(ethereum: Ethereumish) {
  // ethers v5: Web3Provider 需要 EIP-1193 provider
  return new ethers.providers.Web3Provider(ethereum as any);
}

export function useWallet(): UseWalletResult {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shortAccount = useMemo(() => shortAddr(account), [account]);

  const refreshBalance = useCallback(async () => {
    try {
      const ethereum = getEthereum();
      if (!ethereum) return;
      if (!account) return;

      const provider = getWeb3Provider(ethereum);
      const bal = await provider.getBalance(account);
      setBalance(ethers.utils.formatEther(bal));
    } catch (e: any) {
      // 余额刷新失败不一定要打断用户流程，这里只记录
      setError(e?.message ?? "Refresh balance failed");
    }
  }, [account]);

  const connect = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const ethereum = getEthereum();
      if (!ethereum) throw new Error("No wallet found");

      const provider = getWeb3Provider(ethereum);

      // 触发钱包弹窗
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
  }, []);

  const disconnect = useCallback(() => {
    // EIP-1193 不支持“真正断开钱包”，这里只做本地状态清空
    setAccount(null);
    setBalance("0");
    setError(null);
  }, []);

  // 初始化：如果用户已经连接过钱包（授权过），自动读取 account + balance
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const ethereum = getEthereum();
        if (!ethereum) return;

        const provider = getWeb3Provider(ethereum);
        const accounts = await provider.listAccounts();
        const addr = accounts?.[0] ?? null;

        if (cancelled) return;

        setAccount(addr);
        if (!addr) {
          setBalance("0");
          return;
        }

        const bal = await provider.getBalance(addr);
        if (cancelled) return;
        setBalance(ethers.utils.formatEther(bal));
      } catch {
        // 初始化失败就静默，不影响页面
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // 监听：accountsChanged / chainChanged
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