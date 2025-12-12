# 🚀 Web3 Toolkit v10

一个面向 **Web3 学习者 & 前端工程师** 的实战型工具库，目标是：  
**用一套稳定、可复用的工具，快速完成 DApp 从合约 → 部署 → 前端交互的完整闭环。**

> 当前版本：**v10（阶段性完成）**  
> 作者：forth1  
> 状态：持续演进中

---

## ✨ 项目定位

Web3 Toolkit 不是“教程代码”，而是一个 **可直接复用的工程工具库**：

- 不依赖复杂脚手架
- 强调「**真实开发流程**」
- 每一层都能单独拿出来用

适合人群：

- Web3 / Solidity 学习者
- 想从「会写合约」走向「能做 DApp」的前端工程师
- 希望构建自己长期工具库的开发者

---

## 🧱 核心能力（v10）

### 1️⃣ Solidity 合约层（Hardhat）

- `Bank.sol`
  - 存款 / 取款
  - 合约余额查询
- `MyToken.sol`
  - 基于 OpenZeppelin ERC20
  - 可直接用于测试代币交互

📁 目录：
solidity/
├── Bank.sol
└── MyToken.sol
---

### 2️⃣ 部署脚本（Hardhat Scripts）

- 单独部署 Bank
- 单独部署 ERC20
- Bank + Token 一键联合部署

📁 目录：
hardhat/
├── deploy-bank.js
├── deploy-erc20.js
└── deploy-bank-and-token.js
---

### 3️⃣ 前端合约交互工具（React / TypeScript）

**合约实例封装**
- `getBankContract.ts`
- `getBalance.ts`
- `networks.ts`

**常用工具函数**
- `number-utils.ts`
- `formatAddress.ts`

📁 目录：
react/
├── getBankContract.ts
├── getBalance.ts
├── networks.ts
├── number-utils.ts
├── formatAddress.ts
└── BankDappDemo.tsx
---

### 4️⃣ React Hooks 封装

将 Web3 逻辑从 UI 中彻底抽离：

- `useWallet`：钱包连接 / 网络判断
- `useBank`：Bank 合约操作
- `useBankApp`：业务级组合 Hook
- `useMyHook`：通用 Hook 模板

📁 目录：
hooks/
├── useWallet.ts
├── useBank.ts
├── useBankApp.ts
└── useMyHook.ts
---

### 5️⃣ Demo 级 DApp 示例

`BankDappDemo.tsx` 展示了：

- 钱包连接
- 网络校验
- 余额读取
- 存款 / 取款完整流程

> 这是 **v10 的核心里程碑**：  
> 工具库已经可以 **真实支撑一个完整 DApp 页面**

---

## 📦 工程结构总览
web3-toolkit/
├── hardhat/            # 合约部署脚本
├── solidity/           # Solidity 合约
├── react/              # 前端 Web3 工具
├── hooks/              # React Hooks
├── package.json
├── hardhat.config.js
└── README.md
> ❗️`node_modules / .DS_Store` 已被正确忽略，不属于仓库内容

---

## 🧭 版本说明

### v9
- Bank 合约 + 基础前端交互
- 工具函数初步拆分

### ✅ v10（当前）
- ERC20 合约加入
- 部署脚本体系化
- React Hooks 成体系
- Demo DApp 跑通完整流程

**结论：v10 是「工具库可用化」的完成版本**

---

## 🔜 下一步规划（v11+）

- 工具进一步模块化（packages 拆分）
- UI 层抽象（组件库）
- 多网络 / 多合约支持
- 发布为 npm 包
- 更多真实 DApp 示例

---

## 🧠 设计理念

> Web3 学习不是“多看教程”，而是：
>
> **把你写过的每一行代码，沉淀为可复用工具。**

Web3 Toolkit 就是这个沉淀过程的产物。

---

## 📜 License

MIT License