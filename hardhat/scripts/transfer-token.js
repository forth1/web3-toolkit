// hardhat/scripts/transfer-token.js
import { network } from "hardhat";

const TOKEN = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // MyToken
const TO = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";    // account #1
const AMOUNT = 1_000n * 10n ** 18n;                        // 1000 MTK (18 decimals)

const ERC20_ABI = [
  { type: "function", name: "transfer", stateMutability: "nonpayable", inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ], outputs: [{ name: "", type: "bool" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [
      { name: "account", type: "address" },
    ], outputs: [{ name: "", type: "uint256" }] },
];

async function main() {
  // ✅ Hardhat 3：用 network.connect() 拿到注入后的 viem
  const { viem, networkName } = await network.connect();
  console.log("network:", networkName);

  const publicClient = await viem.getPublicClient();
  const [walletClient] = await viem.getWalletClients(); // 默认用 account #0

  const from = walletClient.account.address;
  console.log("from:", from);
  console.log("to:", TO);

  const token = viem.getContract({
    address: TOKEN,
    abi: ERC20_ABI,
    client: { public: publicClient, wallet: walletClient },
  });

  const beforeFrom = await token.read.balanceOf([from]);
  const beforeTo = await token.read.balanceOf([TO]);

  const hash = await token.write.transfer([TO, AMOUNT]);
  console.log("tx:", hash);

  await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });

  const afterFrom = await token.read.balanceOf([from]);
  const afterTo = await token.read.balanceOf([TO]);

  console.log("balance(from) before:", beforeFrom.toString());
  console.log("balance(from) after :", afterFrom.toString());
  console.log("balance(to) before  :", beforeTo.toString());
  console.log("balance(to) after   :", afterTo.toString());
}

main().catch((e) => {
  console.error("❌ script failed:", e);
  process.exit(1);
});