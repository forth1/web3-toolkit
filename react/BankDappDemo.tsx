// react/BankDappDemo.tsx
import React, { useState } from "react";
import { ethers } from "ethers";
import { getBankBalance } from "./getBalance";

export function BankDappDemo() {
  const [balance, setBalance] = useState<string>("");

  async function handleCheckBalance() {
    try {
      // 1. 检查是否有钱包
      if (!(window as any).ethereum) {
        alert("未发现钱包（MetaMask）");
        return;
      }

      // 2. 连接钱包，拿到当前账户地址
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();

      // 3. 调用工具函数读取余额（核心逻辑在工具库里）
      const eth = await getBankBalance(addr);

      // 4. 存到 state 里展示
      setBalance(eth);
    } catch (err) {
      console.error(err);
      alert("读取余额失败，请查看 Console");
    }
  }

  return (
    <div>
      <h2>Bank Dapp Demo</h2>
      <button onClick={handleCheckBalance}>查询当前账户余额</button>
      {balance && <p>余额：{balance} ETH</p >}
    </div>
  );
}