// hardhat/deploy-erc20.js
const { ethers } = require("hardhat");

async function main() {
  // 1. 拿到部署账户（和 Bank 一样）
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", await deployer.getAddress());

  // 2. 准备部署 MyToken 合约
  const MyToken = await ethers.getContractFactory("MyToken");

  // 3. 设置初始总量：1000000 * 10^18
  //    注意：ethers v6 要用 parseUnits，而不是 utils.parseUnits
  const initialSupply = ethers.parseUnits("1000000", 18);

  // 4. 部署（只有一个参数：initialSupply）
  const myToken = await MyToken.deploy(initialSupply);
  await myToken.waitForDeployment();

  console.log("MyToken deployed to:", await myToken.getAddress());
}

// 标准的 main().catch(...) 模板
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
