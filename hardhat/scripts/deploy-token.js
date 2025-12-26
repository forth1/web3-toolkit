import { ethers } from "ethers";
import fs from "fs";
import path from "path";

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getArtifact() {
  const artifactPath = path.resolve(
    "hardhat/artifacts/hardhat/contracts/MyToken.sol/MyToken.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
  return artifact;
}

function exportAbi(artifact) {
  const outDir = path.resolve("src/abi");
  ensureDir(outDir);

  const out = {
    contractName: artifact.contractName,
    abi: artifact.abi,
  };

  const outPath = path.join(outDir, "MyToken.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log("✅ ABI exported ->", outPath);
}

function exportAddresses({ tokenAddress, chainId }) {
  // ✅ 这个文件会被 my-bank-dapp 直接 import 读取
  const outPath = path.resolve("src/config/addresses.localhost.json");
  writeJson(outPath, {
    chainId,
    token: {
      MyToken: tokenAddress,
    },
    updatedAt: new Date().toISOString(),
  });
  console.log("✅ addresses exported ->", outPath);
}

async function main() {
  // ✅ 直连 Hardhat 本地 JSON-RPC
  const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
  const signer = provider.getSigner(0);
  const deployer = await signer.getAddress();
  console.log("Deployer:", deployer);

  const net = await provider.getNetwork();
  const chainId = Number(net.chainId);

  const artifact = getArtifact();
  if (!artifact.abi || !artifact.bytecode) {
    throw new Error("Artifact missing abi/bytecode");
  }

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);

  // 初始总量：1,000,000 MTK（18 位精度）
  const initialSupply = ethers.utils.parseEther("1000000");

  const token = await factory.deploy(initialSupply);
  await token.deployed();

  console.log("✅ MyToken deployed at:", token.address);

  exportAbi(artifact);
  exportAddresses({ tokenAddress: token.address, chainId });
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});