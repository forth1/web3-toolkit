// hooks/useBankApp.ts
import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { getBankContract } from "../bank/getBankContract";
import { formatAddress } from "../core/formatAddress";

export interface BankAppState {
  account: string | null;
  shortAccount: string;
  balance: string;        // ETH 字符串，比如 "0.1234"
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

export function useBankApp(): UseBankAppResult {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0.0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const shortAccount = formatAddress(account);

  // 通用：获取 provider / signer / contract
  const getContext = useCallback(async () => {
    const { provider, signer, contract } = await getBankContract();

    const addr = await signer.getAddress();
    setAccount(addr);

    return { provider, signer, contract, addr };
  }, []);

  // 连接钱包（如果没连接）
  const connect = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await getContext();
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "连接钱包失败");
    } finally {
      setLoading(false);
    }
  }, [getContext]);

  // 刷新 ETH 余额（钱包余额，不是 Bank 里存款）
  const refreshBalance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { provider, addr } = await getContext();
      const wei = await provider.getBalance(addr);
      setBalance(ethers.utils.formatEther(wei));
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "获取余额失败");
    } finally {
      setLoading(false);
    }
  }, [getContext]);

  // 存款到 Bank 合约
  const deposit = useCallback(
    async (amountEth: string) => {
      try {
        setLoading(true);
        setError(null);
        setTxHash(null);

        const { contract } = await getContext();
        const value = ethers.utils.parseEther(amountEth);
        const tx = await contract.deposit({ value });
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
    [getContext, refreshBalance]
  );

  // 从 Bank 合约取款
  const withdraw = useCallback(
    async (amountEth: string) => {
      try {
        setLoading(true);
        setError(null);
        setTxHash(null);

        const { contract } = await getContext();
        const value = ethers.utils.parseEther(amountEth);
        const tx = await contract.withdraw(value);
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
    [getContext, refreshBalance]
  );

  // 页面加载时自动尝试连一次（如果用户已经授权过）
  useEffect(() => {
    (async () => {
      try {
        if (!(window as any).ethereum) return;
        const { ethereum } = window as any;
        const accounts: string[] = await ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          await refreshBalance();
        }
      } catch (e) {
        // 静默失败即可
      }
    })();
  }, [refreshBalance]);

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