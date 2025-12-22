// src/bank/getBankContract.ts
import { ethers } from "ethers";
import EventsBankArtifact from "../abi/Lesson8_EventsBank.json";
import { NETWORKS } from "../core/networks";
import { getEthereum } from "../core/ethereum";

/**
 * ✅ 只认你 networks 里真实存在的字段：
 * - NETWORKS.local.Lesson8_EventsBank（与你 deployments.json key 对齐）
 * - 或 NETWORKS.local.eventsBank（备用别名）
 */
export const EVENTS_BANK_ADDRESS: string =
  (NETWORKS as any)?.local?.Lesson8_EventsBank ||
  (NETWORKS as any)?.local?.eventsBank ||
  "";

export type BankContractContext = {
  provider: ethers.providers.Web3Provider;
  signer: ethers.Signer;
  contract: ethers.Contract;
  address: string;
};

function assertAddress(addr: string, label = "contract address") {
  if (!addr) throw new Error(`${label} missing`);
  if (!ethers.utils.isAddress(addr)) throw new Error(`${label} invalid: ${addr}`);
  if (addr === ethers.constants.AddressZero) {
    throw new Error(`${label} cannot be AddressZero`);
  }
}

function getAbiFromArtifact(artifact: any) {
  const abi = artifact?.abi; // ✅ 用参数，不要写死
  if (!abi || !Array.isArray(abi) || abi.length === 0) {
    throw new Error("ABI missing/invalid: Lesson8_EventsBank.json has no .abi");
  }
  return abi;
}

// ✅ 库代码不要依赖 import.meta.env / process（避免 TS 报错 & 兼容 tsup）
// 规则：
// - 如果你在浏览器里手动设了 globalThis.__DEV__ = true/false，则优先用它
// - 否则看 globalThis.process?.env?.NODE_ENV（注意：不直接引用 process 这个名字）
function isDev(): boolean {
  const g: any = typeof globalThis !== "undefined" ? (globalThis as any) : undefined;
  if (g && typeof g.__DEV__ === "boolean") return g.__DEV__;

  const nodeEnv = g?.process?.env?.NODE_ENV; // ✅ 不会触发 “Cannot find name 'process'”
  return nodeEnv !== "production";
}

export async function getBankContract(): Promise<BankContractContext> {
  const ethereum = getEthereum();
  if (!ethereum) {
    throw new Error("MetaMask not found. Please install MetaMask.");
  }

  assertAddress(
    EVENTS_BANK_ADDRESS,
    "Contract address (NETWORKS.local.Lesson8_EventsBank or NETWORKS.local.eventsBank)"
  );

  // ✅ ethers v5 provider + signer
  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();

  // ✅ ABI
  const abi = getAbiFromArtifact(EventsBankArtifact);

  // ✅ 合约代码存在性校验（防错链 / 错地址）
  const code = await provider.getCode(EVENTS_BANK_ADDRESS);
  if (!code || code === "0x") {
    const net = await provider.getNetwork().catch(() => null);
    const chainId = net?.chainId;
    throw new Error(
      `No contract code at ${EVENTS_BANK_ADDRESS}. Check network/chainId (${chainId ?? "unknown"}) and deployments.`
    );
  }

  // ===============================
  // 🔥 关键：拦截 eth_call，打印 selector -> 函数签名（每个 selector 只打印一次）
  // ===============================
  if (isDev()) {
    const anyProvider = provider as any;

    if (!anyProvider.__BANK_DEBUG_PATCHED__) {
      const origSend = anyProvider.send.bind(anyProvider);

      // selector -> signature
      const iface = new ethers.utils.Interface(abi);
      const selectorToSig: Record<string, string> = {};
      Object.values(iface.functions).forEach((f) => {
        const sig = f.format(); // e.g. "balances(address)"
        const sel = iface.getSighash(f); // e.g. "0x27e235e3"
        selectorToSig[sel] = sig;
      });

      // ✅ 防刷屏：每个 selector 只打印一次
      const printed = new Set<string>();

      anyProvider.send = async (method: string, params: any[]) => {
        const p0 = params?.[0];
        const to = (p0?.to ?? "").toLowerCase();
        const data: string | undefined = p0?.data;

        const isBankCall =
          method === "eth_call" &&
          to === EVENTS_BANK_ADDRESS.toLowerCase() &&
          typeof data === "string" &&
          data.startsWith("0x") &&
          data.length >= 10;

        if (isBankCall) {
          const selector = data.slice(0, 10);
          const sig = selectorToSig[selector] || "UNKNOWN_SELECTOR";

          if (!printed.has(selector)) {
            printed.add(selector);
            console.log("[BANK eth_call]", selector, "=>", sig, "to", to);
            console.trace("[BANK eth_call stack]");
          }
        }

        try {
          return await origSend(method, params);
        } catch (e: any) {
          if (isBankCall) {
            const selector = (data as string).slice(0, 10);
            const sig = selectorToSig[selector] || "UNKNOWN_SELECTOR";
            console.error("[BANK eth_call FAILED]", selector, "=>", sig, e?.reason || e?.message || e);
          }
          throw e;
        }
      };

      anyProvider.__BANK_DEBUG_PATCHED__ = true;
    }
  }

  const contract = new ethers.Contract(EVENTS_BANK_ADDRESS, abi, signer);

  // 👉 暴露到 window，方便你在浏览器直接查
  if (isDev() && typeof window !== "undefined") {
    (window as any).__BANK_CONTRACT__ = contract;
    (window as any).__BANK_ADDR__ = EVENTS_BANK_ADDRESS;
  }

  return {
    provider,
    signer,
    contract,
    address: EVENTS_BANK_ADDRESS,
  };
}