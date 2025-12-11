🚀 Web3 开发工具库（v1）

一个为前端工程师准备的 Web3 快速开发工具包。包含 Hardhat 部署模版、智能合约交互封装、常用 ETH 工具函数，以及可复用 React Hooks。
📦 功能简介

本工具库为 Web3 学习者与前端开发者提供：
	•	✔ Hardhat 合约部署模板（可一键复用）
	•	✔ React + Ethers 前端三件套封装
	•	✔ 自动选择 ABI + 地址的合约连接器
	•	✔ 常用 ETH 单位处理工具（parseEther / formatEther）
	•	✔ 通用 React Hook 模版（可扩展）

适合快速构建 DApp，不用重复写模板代码。
📁 目录结构
<details>
<summary><strong>点击展开目录结构</strong></summary>
my-web3-dev-library/
│
├── solidity/
│   └── Bank.sol                 # Bank 合约（存款 / 提现）
│
├── hardhat/
│   ├── deploy-bank.js           # Hardhat 部署脚本
│   └── COMMANDS.md              # 常用 Hardhat 命令速查
│
├── react/
│   ├── getBankContract.ts       # 自动选择 ABI + 地址并返回 contract 实例
│   └── number-utils.ts          # parseEther / formatEther 工具
│
├── hooks/
│   └── useMyHook.ts             # 通用 React Hook 模板
│
└── README.md
</details>
🔧 使用方法

1️⃣ Hardhat — 部署智能合约

在 /hardhat 目录下运行：
npx hardhat compile
npx hardhat run hardhat/deploy-bank.js --network sepolia
部署成功后将输出合约地址，供前端调用。
2️⃣ 前端 —— 获取 Bank 合约实例

使用 getBankContract.ts：
import getBankContract from "../react/getBankContract";

const contract = await getBankContract();
自动返回：
	•	provider
	•	signer
	•	contract（ABI + 地址已绑定）
3️⃣ ETH 单位常用工具

在 number-utils.ts：
import { ethers } from "ethers";

const wei = ethers.utils.parseEther("0.1");      // ETH → Wei
const eth = ethers.utils.formatEther(wei);       // Wei → ETH
4️⃣ React 通用 Hook 模板
文件：hooks/useMyHook.ts
export function useMyHook() {
  const [data, setData] = useState<string | null>(null);

  useEffect(() => {
    // 你可以在这里写自己的逻辑
    // setData("hello web3");
  }, []);

  return { data };
}
🚀 如何开始使用本工具库

克隆仓库（示例）
git clone https://github.com/你的用户名/web3-toolkit.git
安装依赖（如使用 Hardhat）
npm install
编译 & 部署
npx hardhat compile
npx hardhat run hardhat/deploy-bank.js --network sepolia
## 上传到 GitHub 的步骤（备忘）

```bash
git init
git add .
git commit -m "web3 toolkit v1"
git branch -M main
git remote add origin https://github.com/你的用户名/web3-toolkit.git
git push -u origin main
### 📌 发布版本（Tag）

首次发布：
```bash
git tag v1
git push origin v1
## 上传到 GitHub 的步骤2（备忘）

```bash
git add .
git commit -m "release v2"
git push origin main
git tag v2
git push origin v2


