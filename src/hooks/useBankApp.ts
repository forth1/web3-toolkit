// src/hooks/useBankApp.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { getBankContract } from "../bank/getBankContract";
import { formatAddress } from "../core/formatAddress";
import { getEthereum } from "../core/ethereum";

export interface BankAppState {
  account: string | null;
  shortAccount: string;
  balance: string; // 钱包 ETH 余额字符串
  loading: boolean;
  error: string | null;
  txHash: string | null;
}

export interface UseBankAppResult extends BankAppState {
  connect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  deposit: (amountEth: string) => Promise<void>;
  withdraw: (amountEth: string) => Promise<void>;
}

function getWeb3Provider() {
  const ethereum = getEthereum();
  if (!ethereum) throw new Error("No wallet found");
  return new ethers.providers.Web3Provider(ethereum as any);
}

export function useBankApp(): UseBankAppResult {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const shortAccount = useMemo(() => formatAddress(account), [account]);

  // 统一获取 signer + address（不再依赖 getBankContract 返回 provider/signer）
  const getSignerAndAddr = useCallback(async () => {
    const provider = getWeb3Provider();
    const signer = provider.getSigner();
    const addr = await signer.getAddress();
    setAccount(addr);
    return { provider, signer, addr };
  }, []);

  // 连接钱包（触发弹窗）
  const connect = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const provider = getWeb3Provider();
      await provider.send("eth_requestAccounts", []);

      const signer = provider.getSigner();
      const addr = await signer.getAddress();
      setAccount(addr);

      const wei = await provider.getBalance(addr);
      setBalance(ethers.utils.formatEther(wei));
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "连接钱包失败");
    } finally {
      setLoading(false);
    }
  }, []);

  // 刷新钱包 ETH 余额
  const refreshBalance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { provider, addr } = await getSignerAndAddr();
      const wei = await provider.getBalance(addr);
      setBalance(ethers.utils.formatEther(wei));
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "获取余额失败");
    } finally {
      setLoading(false);
    }
  }, [getSignerAndAddr]);

  // 存款到 Bank 合约（使用 value）
  const deposit = useCallback(
    async (amountEth: string) => {
      try {
        setLoading(true);
        setError(null);
        setTxHash(null);

        const contract = await getBankContract(); // ✅ 现在只返回 contract
        const value = ethers.utils.parseEther(amountEth);

        const tx = await (contract as any).deposit({ value });
        setTxHash(tx.hash);
        await tx.wait();

        await refreshBalance();
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? "存款失败");
      } finally {
        setLoading(false);
      }
    },
    [refreshBalance]
  );

  // 取款
  const withdraw = useCallback(
    async (amountEth: string) => {
      try {
        setLoading(true);
        setError(null);
        setTxHash(null);

        const contract = await getBankContract();
        const value = ethers.utils.parseEther(amountEth);

        const tx = await (contract as any).withdraw(value);
        setTxHash(tx.hash);
        await tx.wait();

        await refreshBalance();
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? "取款失败");
      } finally {
        setLoading(false);
      }
    },
    [refreshBalance]
  );

  // 初始化：如果用户已授权过，自动读取 account + balance（静默，不弹窗）
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const ethereum = getEthereum();
        if (!ethereum) return;

        const provider = new ethers.providers.Web3Provider(ethereum as any);
        const accounts = await provider.listAccounts();
        const addr = accounts?.[0] ?? null;

        if (cancelled) return;

        setAccount(addr);
        if (!addr) {
          setBalance("0");
          return;
        }

        const wei = await provider.getBalance(addr);
        if (cancelled) return;
        setBalance(ethers.utils.formatEther(wei));
      } catch {
        // 静默失败
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    account,
    shortAccount,
    balance,
    loading,
    error,
    txHash,
    connect,
    refreshBalance,
    deposit,
    withdraw,
  };
}

export default useBankApp;