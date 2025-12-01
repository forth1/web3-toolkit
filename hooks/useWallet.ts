// hooks/useWallet.ts
import { useState, useEffect } from "react";

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);

  async function connect() {
    if (!window.ethereum) return alert("Please install MetaMask");
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    setAddress(accounts[0]);
  }

  function disconnect() {
    setAddress(null);
  }

  useEffect(() => {
    if (!window.ethereum) return;

    // 监听账户切换
    window.ethereum.on("accountsChanged", (accounts: string[]) => {
      setAddress(accounts[0] || null);
    });

    // 监听链切换
    window.ethereum.on("chainChanged", () => {
      window.location.reload();
    });
  }, []);

  return {
    address,
    isConnected: !!address,
    connect,
    disconnect,
  };
}