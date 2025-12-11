// hardhat/deploy-bank.js

const { ethers } = require("hardhat");

async function main() {
  // 1. 拿到 Bank 合约工厂（注意这里一定要加 await）
  const Bank = await ethers.getContractFactory("Bank");

  // 2. 部署合约
  const bank = await Bank.deploy();

  // 3. 等待部署完成
  await bank.waitForDeployment();

  // 4. 打印部署后的地址
  console.log("Bank deployed to:", await bank.getAddress());
}

// 标准 Hardhat 启动方式
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
