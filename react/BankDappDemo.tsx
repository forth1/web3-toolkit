import React, { useState } from "react";
import useBankApp from "../hooks/useBankApp";

export default function BankDappDemo() {
  const [amount, setAmount] = useState("0.01");
  const {
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
  } = useBankApp();

  return (
    <div>
      <h1>Bank DApp Demo (v6)</h1>

      <p>当前地址：{shortAccount || "未连接"}</p>
      <p>钱包余额：{balance} ETH</p>

      <button onClick={connect} disabled={loading}>
        连接钱包
      </button>
      <button onClick={refreshBalance} disabled={loading}>
        刷新余额
      </button>

      <div>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.01"
        />
        <button onClick={() => deposit(amount)} disabled={loading}>
          存款
        </button>
        <button onClick={() => withdraw(amount)} disabled={loading}>
          取款
        </button>
      </div>

      {loading && <p>⏳ 处理中...</p>}
      {error && <p style={{ color: "red" }}>❌ {error}</p>}
      {txHash && (
        <p>
          ✅ Tx:{" "}
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
          >
            查看交易
          </a>
        </p>
      )}
    </div>
  );
}