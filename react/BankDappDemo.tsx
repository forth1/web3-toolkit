import React, { useState } from "react";
import useBankApp from "../hooks/useBankApp";

export default function BankDappDemo() {
  const [amount, setAmount] = useState("0.01");

  const {
    account,
    shortAccount,
    chainId,
    balance,
    loading,
    error,
    txHash,
    connect,
    refreshBalance,
    deposit,
    withdraw,
  } = useBankApp();

  // 一点简单样式（内联 style，方便你看懂）
  const pageStyle = {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "radial-gradient(circle at top, #1e293b 0, #020617 55%, #000 100%)",
    fontFamily: `system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif`,
    padding: "24px",
    color: "#e5e7eb",
  } as const;

  const cardStyle = {
    width: "420px",
    background: "rgba(15,23,42,0.96)",
    borderRadius: "18px",
    padding: "22px 22px 18px",
    boxShadow: "0 24px 60px rgba(15,23,42,0.9)",
    border: "1px solid rgba(148,163,184,0.3)",
    backdropFilter: "blur(16px)",
  } as const;

  const headerStyle = {
    marginBottom: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  } as const;

  const titleStyle = {
    fontSize: "20px",
    fontWeight: 700,
    letterSpacing: "0.03em",
  } as const;

  const badgeStyle = {
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "11px",
    background: "rgba(56,189,248,0.1)",
    border: "1px solid rgba(56,189,248,0.5)",
    color: "#7dd3fc",
  } as const;

  const sectionStyle = {
    marginTop: "14px",
    marginBottom: "8px",
    padding: "10px 12px",
    borderRadius: "12px",
    background: "rgba(15,23,42,0.7)",
    border: "1px solid rgba(51,65,85,0.8)",
  } as const;

  const labelStyle = {
    fontSize: "11px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
    color: "#9ca3af",
    marginBottom: "4px",
  };

  const valueRow = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "13px",
  } as const;

  const buttonRow = {
    display: "flex",
    gap: "8px",
    marginTop: "10px",
  } as const;

  const primaryButton = (disabled: boolean) =>
    ({
      flex: 1,
      padding: "8px 10px",
      borderRadius: "999px",
      border: "none",
      fontSize: "13px",
      fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer",
      background: disabled
        ? "rgba(55,65,81,0.8)"
        : "linear-gradient(135deg, #38bdf8, #22c55e)",
      color: "#0b1120",
      boxShadow: disabled
        ? "none"
        : "0 8px 20px rgba(34,197,94,0.45)",
      transition: "transform 0.08s ease-out, box-shadow 0.08s ease-out",
    } as const);

  const ghostButton = (disabled: boolean) =>
    ({
      flex: 1,
      padding: "8px 10px",
      borderRadius: "999px",
      border: "1px solid rgba(148,163,184,0.6)",
      fontSize: "13px",
      fontWeight: 500,
      cursor: disabled ? "not-allowed" : "pointer",
      background: disabled ? "rgba(15,23,42,0.7)" : "transparent",
      color: "#e5e7eb",
    } as const);

  const inputRow = {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
  } as const;

  const inputStyle = {
    flex: 1,
    padding: "8px 10px",
    borderRadius: "999px",
    border: "1px solid rgba(148,163,184,0.6)",
    background: "rgba(15,23,42,0.9)",
    color: "#e5e7eb",
    fontSize: "13px",
    outline: "none",
  } as const;

  const pillTag = {
    padding: "2px 8px",
    borderRadius: "999px",
    fontSize: "11px",
    background: "rgba(15,23,42,0.8)",
    border: "1px solid rgba(55,65,81,0.9)",
  } as const;

  const hintText = {
    fontSize: "11px",
    color: "#9ca3af",
    marginTop: "6px",
  } as const;

  const statusText = {
    marginTop: "10px",
    fontSize: "12px",
    lineHeight: 1.5,
  } as const;

  const linkStyle = {
    color: "#38bdf8",
    textDecoration: "none",
    fontSize: "12px",
  } as const;

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        {/* 顶部标题区域 */}
        <div style={headerStyle}>
          <div>
            <div style={titleStyle}>Bank DApp Demo (v8)</div>
            <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: 4 }}>
              前端 + 合约一体的教学示例
            </div>
          </div>
          <div style={badgeStyle}>Web3 Toolkit</div>
        </div>

        {/* 钱包状态 */}
        <div style={sectionStyle}>
          <div style={labelStyle}>WALLET</div>
          <div style={valueRow}>
            <span>地址</span>
            <span style={{ fontFamily: "monospace", fontSize: "12px" }}>
              {shortAccount || "未连接"}
            </span>
          </div>
          <div style={{ ...valueRow, marginTop: 6 }}>
            <span>网络</span>
            <span style={{ fontSize: "12px" }}>
              {chainId ? `ChainId: ${chainId}` : "未知"}
            </span>
          </div>
        </div>

        {/* 余额信息 */}
        <div style={sectionStyle}>
          <div style={labelStyle}>BALANCE</div>
          <div style={valueRow}>
            <span>钱包余额</span>
            <span style={{ fontSize: "15px", fontWeight: 600 }}>
              {balance} <span style={{ fontSize: "12px" }}>ETH</span>
            </span>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <span style={pillTag}>账户：{account ? "已连接" : "未连接"}</span>
            <span style={pillTag}>
              状态：{loading ? "处理中..." : "空闲"}
            </span>
          </div>
        </div>

        {/* 操作按钮：连接 + 刷新 */}
        <div style={buttonRow}>
          <button
            style={primaryButton(loading)}
            onClick={connect}
            disabled={loading}
          >
            {account ? "切换钱包" : "连接钱包"}
          </button>
          <button
            style={ghostButton(loading)}
            onClick={refreshBalance}
            disabled={loading}
          >
            刷新余额
          </button>
        </div>

        {/* 存取款操作 */}
        <div style={{ ...sectionStyle, marginTop: "14px" }}>
          <div style={labelStyle}>ACTIONS</div>

          <div style={inputRow}>
            <input
              style={inputStyle}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.01"
            />
            <button
              style={ghostButton(loading)}
              onClick={() => setAmount("0.01")}
              disabled={loading}
            >
              0.01
            </button>
          </div>

          <div style={buttonRow}>
            <button
              style={primaryButton(loading)}
              onClick={() => deposit(amount)}
              disabled={loading}
            >
              存款
            </button>
            <button
              style={ghostButton(loading)}
              onClick={() => withdraw(amount)}
              disabled={loading}
            >
              取款
            </button>
          </div>

          <div style={hintText}>
            建议先从测试网 faucet 领一点 Sepolia ETH 再体验存取款。
          </div>
        </div>

        {/* 状态 & 提示 */}
        <div style={statusText}>
          {loading && <div>⏳ 交易发送中，请稍候…</div>}
          {error && <div style={{ color: "#fca5a5" }}>❌ {error}</div>}
          {txHash && (
            <div>
              ✅ 最近一次交易：
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                style={linkStyle}
              >
                在 Etherscan 查看
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}