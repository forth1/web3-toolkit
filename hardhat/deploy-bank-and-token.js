const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Bank
  const Bank = await ethers.getContractFactory("Bank");
  const bank = await Bank.deploy();
  await bank.deployed();
  console.log("Bank deployed at:", bank.address);

  // Token
  const MyToken = await ethers.getContractFactory("MyToken");
  const initialSupply = 1000000n * 10n ** 18n;
  const myToken = await MyToken.deploy("MyToken", "MTK", initialSupply);
  await myToken.deployed();
  console.log("MyToken deployed at:", myToken.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
