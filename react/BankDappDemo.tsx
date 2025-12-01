// react/BankDappDemo.tsx
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getBankContract } from "./getBankContract";

// 一个最小可用的 Bank DApp 示例组件
// 依赖：React、ethers、浏览器钱包（MetaMask 等）、getBankContract.ts

const BankDappDemo: React.FC = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState("0");
  const [bankBalance, setBankBalance] = useState("0");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // 连接钱包
  async function connectWallet() {
    if (!(window as any).ethereum) {
      alert("请先安装 MetaMask / OKX 等浏览器钱包");
      return;
    }
    try {
      const eth = (window as any).ethereum;
      const accounts: string[] = await eth.request({
        method: "eth_requestAccounts",
      });
      const addr = accounts[0];
      setAddress(addr);
      setMessage("钱包已连接");
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "连接钱包失败");
    }
  }

  // 刷新 Bank 余额 & 钱包余额
  async function refreshBalances() {
    if (!address) return;
    try {
      setLoading(true);
      const { contract, provider } = await getBankContract();

      const [bankRaw, walletRaw] = await Promise.all([
        contract.balances(address),
        provider.getBalance(address),
      ]);

      setBankBalance(ethers.utils.formatEther(bankRaw ?? 0));
      setWalletBalance(ethers.utils.formatEther(walletRaw ?? 0));
      setMessage("余额已刷新");
    } catch (e) {
      console.error(e);
      alert("刷新余额失败，请看控制台");
    } finally {
      setLoading(false);
    }
  }

  // 存款
  async function handleDeposit() {
    if (!address) {
      return alert("请先连接钱包");
    }
    if (!amount || Number(amount) <= 0) {
      return alert("请输入正确的金额");
    }

    try {
      setLoading(true);
      const { contract } = await getBankContract();
      const tx = await contract.deposit({
        value: ethers.utils.parseEther(amount),
      });
      setMessage("交易发送中，等待确认…");
      await tx.wait();
      setAmount("");
      setMessage("存款成功");
      await refreshBalances();
    } catch (e: any) {
      console.error(e);
      alert(e?.reason || e?.message || "存款失败");
    } finally {
      setLoading(false);
    }
  }

  // 取款
  async function handleWithdraw() {
    if (!address) {
      return alert("请先连接钱包");
    }
    if (!amount || Number(amount) <= 0) {
      return alert("请输入正确的金额");
    }

    try {
      setLoading(true);
      const { contract } = await getBankContract();
      const tx = await contract.withdraw(ethers.utils.parseEther(amount));
      setMessage("交易发送中，等待确认…");
      await tx.wait();
      setAmount("");
      setMessage("取款成功");
      await refreshBalances();
    } catch (e: any) {
      console.error(e);
      alert(e?.reason || e?.message || "取款失败");
    } finally {
      setLoading(false);
    }
  }

  // 当地址变化时自动刷新一次余额
  useEffect(() => {
    if (address) {
      refreshBalances();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  return (
    <div
      style={{
        maxWidth: 520,
        margin: "40px auto",
        padding: 24,
        borderRadius: 16,
        border: "1px solid #e5e7eb",
        boxShadow: "0 18px 35px rgba(15,23,42,0.08)",
        fontFamily: "-apple-system,BlinkMacSystemFont,system-ui,sans-serif",
        background: "#ffffff",
      }}
    >
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>Bank DApp Demo</h1>
      <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>
        这是一个可以直接复用的 Bank DApp 前端模板。
      </p>

      {/* 钱包状态 */}
      <div
        style={{
          padding: 12,
          borderRadius: 12,
          background: "#f9fafb",
          marginBottom: 16,
          fontSize: 13,
        }}
      >
        <div style={{ marginBottom: 8 }}>
          <strong>地址：</strong>
          {address ? (
            <span style={{ fontFamily: "monospace" }}>
              {address.slice(0, 6)}…{address.slice(-4)}
            </span>
          ) : (
            <span style={{ color: "#9ca3af" }}>未连接</span>
          )}
        </div>
        <button
          onClick={connectWallet}
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            border: "none",
            background: "#111827",
            color: "#f9fafb",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          {address ? "重新连接钱包" : "连接钱包"}
        </button>
      </div>

      {/* 余额信息 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 16,
          fontSize: 13,
        }}
      >
        <div
          style={{
            padding: 10,
            borderRadius: 12,
            background: "#eef2ff",
          }}
        >
          <div style={{ fontSize: 11, color: "#6b7280" }}>钱包余额</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            {walletBalance} ETH
          </div>
        </div>
        <div
          style={{
            padding: 10,
            borderRadius: 12,
            background: "#ecfeff",
          }}
        >
          <div style={{ fontSize: 11, color: "#6b7280" }}>Bank 合约余额</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            {bankBalance} ETH
          </div>
        </div>
      </div>

      {/* 金额输入 + 按钮 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          type="number"
          value={amount}
          placeholder="0.01"
          onChange={(e) => setAmount(e.target.value)}
          style={{
            flex: 1,
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            fontSize: 13,
          }}
        />
        <button
          onClick={refreshBalances}
          disabled={loading || !address}
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "#f9fafb",
            fontSize: 13,
            cursor: loading || !address ? "not-allowed" : "pointer",
          }}
        >
          刷新
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={handleDeposit}
          disabled={loading || !address}
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: 8,
            border: "none",
            background: "#4f46e5",
            color: "#fff",
            fontSize: 13,
            cursor: loading || !address ? "not-allowed" : "pointer",
          }}
        >
          存款
        </button>
        <button
          onClick={handleWithdraw}
          disabled={loading || !address}
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: 8,
            border: "none",
            background: "#dc2626",
            color: "#fff",
            fontSize: 13,
            cursor: loading || !address ? "not-allowed" : "pointer",
          }}
        >
          取款
        </button>
      </div>

      {/* 状态提示 */}
      {message && (
        <div
          style={{
            fontSize: 12,
            color: "#6b7280",
          }}
        >
          {loading ? "⏳ " : "✅ "}
          {message}
        </div>
      )}
    </div>
  );
};

export default BankDappDemo;