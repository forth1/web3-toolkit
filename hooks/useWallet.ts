// hooks/useWallet.ts
// v7: 自动监听账户 & 网络变化的通用钱包 Hook

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

export interface UseWalletResult {
  account: string | null;
  shortAccount: string | null;
  chainId: string | null;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  loading: boolean;
  error: string | null;
  connect: () => Promise<void>;
}

function formatShortAccount(account?: string | null) {
  if (!account) return null;
  return `${account.slice(0, 6)}...${account.slice(-4)}`;
}

export function useWallet(): UseWalletResult {
  const [account, setAccount] = useState<string | null>(null);
  const [shortAccount, setShortAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初始化 provider
  const setupProvider = useCallback(() => {
    if (typeof window === "undefined") return null;
    const { ethereum } = window as any;
    if (!ethereum) {
      setError("未检测到钱包，请先安装 MetaMask 等 Web3 钱包。");
      return null;
    }
    const web3Provider = new ethers.providers.Web3Provider(ethereum);
    setProvider(web3Provider);
    return { ethereum, web3Provider };
  }, []);

  // 手动连接钱包
  const connect = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = setupProvider();
      if (!result) return;

      const { ethereum, web3Provider } = result;

      // 请求账户授权
      const accounts: string[] = await ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        setError("未获取到账户，请在钱包中确认授权。");
        return;
      }

      const currentAccount = accounts[0];
      const signer = web3Provider.getSigner();
      const network = await web3Provider.getNetwork();

      setAccount(currentAccount);
      setShortAccount(formatShortAccount(currentAccount));
      setSigner(signer);
      setChainId(network.chainId.toString());
    } catch (err: any) {
      console.error("连接钱包失败", err);
      setError(err?.message ?? "连接钱包失败");
    } finally {
      setLoading(false);
    }
  }, [setupProvider]);

  // 组件挂载时，尝试读取已连接账户 + 监听事件
  useEffect(() => {
    if (typeof window === "undefined") return;

    const { ethereum } = window as any;
    if (!ethereum) return;

    const web3Provider = new ethers.providers.Web3Provider(ethereum);
    setProvider(web3Provider);

    // 1）尝试读取已连接账户（页面刷新时自动恢复）
    (async () => {
      try {
        const accounts: string[] = await ethereum.request({
          method: "eth_accounts",
        });

        if (accounts && accounts.length > 0) {
          const currentAccount = accounts[0];
          const signer = web3Provider.getSigner();
          const network = await web3Provider.getNetwork();

          setAccount(currentAccount);
          setShortAccount(formatShortAccount(currentAccount));
          setSigner(signer);
          setChainId(network.chainId.toString());
        }
      } catch (err) {
        console.warn("读取已有账户失败", err);
      }
    })();

    // 2）监听账户变化
    const handleAccountsChanged = async (accounts: string[]) => {
      console.log("accountsChanged", accounts);

      if (!accounts || accounts.length === 0) {
        // 用户断开连接
        setAccount(null);
        setShortAccount(null);
        setSigner(null);
        return;
      }

      const currentAccount = accounts[0];
      const signer = web3Provider.getSigner();

      setAccount(currentAccount);
      setShortAccount(formatShortAccount(currentAccount));
      setSigner(signer);
    };

    // 3）监听网络变化
    const handleChainChanged = async (newChainId: string) => {
      console.log("chainChanged", newChainId);

      // EIP-1193 里 newChainId 通常是 0x 开头的十六进制
      setChainId(newChainId);

      // 切网络时，ethers 建议重新创建 provider
      const newProvider = new ethers.providers.Web3Provider(ethereum);
      setProvider(newProvider);

      if (account) {
        const signer = newProvider.getSigner();
        setSigner(signer);
      }
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);

    // 清理监听（组件卸载）
    return () => {
      if (ethereum.removeListener) {
        ethereum.removeListener("accountsChanged", handleAccountsChanged);
        ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [account]);

  return {
    account,
    shortAccount,
    chainId,
    provider,
    signer,
    loading,
    error,
    connect,
  };
}

export default useWallet;