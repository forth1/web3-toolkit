// hardhat/scripts/check-viem.js
// 作用：Hardhat v3 下正确检查 hardhat-viem 是否注册成功，并测试 RPC 是否通

import hre from "hardhat";

async function main() {
  console.log("=== check viem (Hardhat v3) ===");

  // ✅ Hardhat v3 正确姿势：通过 network.connect() 拿到 viem 实例
  // 文档示例就是：const { viem } = await hre.network.connect();  [oai_citation:2‡hardhat.org](https://hardhat.org/docs/guides/testing/using-viem)
  const connection = await hre.network.connect();

  console.log("networkName:", connection.networkName);
  console.log("connection keys:", Object.keys(connection));

  const viem = connection.viem;
  const hasViem = !!viem;
  console.log("has viem:", hasViem);

  if (!hasViem) {
    console.log("❌ viem is undefined");
    console.log("=> 99% 是 hardhat.config.js 没按 Hardhat v3 的 plugins: [hardhatViem] 注册");
    return;
  }

  console.log("viem keys:", Object.keys(viem));

  // ✅ 读一下链信息，确认 RPC/连接正常
  const publicClient = await viem.getPublicClient();
  const chainId = await publicClient.getChainId();
  const blockNumber = await publicClient.getBlockNumber();

  console.log("publicClient OK");
  console.log("chainId:", chainId);
  console.log("blockNumber:", blockNumber);
}

main().catch((e) => {
  console.error("❌ check-viem failed:", e);
  process.exitCode = 1;
});