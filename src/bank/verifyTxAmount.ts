import { ethers } from "ethers";

export type BankEventType = "Deposit" | "Withdraw";

export type VerifyBankTxAmountArgs = {
  provider: ethers.providers.Provider;
  contract: ethers.Contract;
  txHash: string;
  type: BankEventType;
  expectedAmountEth: string; // 你 UI 输入的 ETH 字符串，例如 "0.001"
  user?: string; // 可选：如果传了，就校验事件里的 user 必须等于它
};

export type VerifyBankTxAmountResult = {
  ok: boolean;
  expectedAmountEth: string;
  actualAmountEth: string;
  source: "event" | "tx.value" | "none";
  reason?: string;
};

function assertAddress(addr: string, label = "address") {
  if (!ethers.utils.isAddress(addr) || addr === ethers.constants.AddressZero) {
    throw new Error(`${label} invalid: ${addr}`);
  }
}

function toWeiSafe(amountEth: string): ethers.BigNumber {
  // parseEther 对 "0.001" 这类是安全的
  return ethers.utils.parseEther((amountEth || "").trim());
}

function sameAddress(a?: string, b?: string) {
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
}

/**
 * ✅ 核心：校验 Deposit/Withdraw 的金额（生产级）
 * - Deposit：优先用事件 Deposit.amount；如果没事件，再退化用 tx.value
 * - Withdraw：只认事件 Withdraw.amount（tx.value 一定是 0）
 */
export async function verifyBankTxAmount(
  args: VerifyBankTxAmountArgs
): Promise<VerifyBankTxAmountResult> {
  const { provider, contract, txHash, type, expectedAmountEth, user } = args;

  const expectedWei = toWeiSafe(expectedAmountEth);

  // 1) receipt 必须存在且成功
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) {
    return {
      ok: false,
      expectedAmountEth,
      actualAmountEth: "0",
      source: "none",
      reason: `tx receipt not found: ${txHash}`,
    };
  }
  if (receipt.status !== 1) {
    return {
      ok: false,
      expectedAmountEth,
      actualAmountEth: "0",
      source: "none",
      reason: `tx reverted: ${txHash}`,
    };
  }

  // 2) 解析事件（最权威）
  const parsed = receipt.logs
    .map((l) => {
      try {
        return contract.interface.parseLog(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean) as Array<ethers.utils.LogDescription>;

  const ev = parsed.find((p) => p.name === type);
  if (ev) {
    const evUser = (ev.args as any)?.user as string | undefined;
    const evAmount = (ev.args as any)?.amount as ethers.BigNumber | undefined;

    if (user) assertAddress(user, "user");
    if (user && evUser && !sameAddress(user, evUser)) {
      return {
        ok: false,
        expectedAmountEth,
        actualAmountEth: ethers.utils.formatEther(evAmount ?? 0),
        source: "event",
        reason: `event.user mismatch: expected=${user}, got=${evUser}`,
      };
    }

    if (!evAmount || !ethers.BigNumber.isBigNumber(evAmount)) {
      return {
        ok: false,
        expectedAmountEth,
        actualAmountEth: "0",
        source: "event",
        reason: `event.amount missing/invalid`,
      };
    }

    const ok = evAmount.eq(expectedWei);
    return {
      ok,
      expectedAmountEth,
      actualAmountEth: ethers.utils.formatEther(evAmount),
      source: "event",
      reason: ok ? undefined : `event.amount != expected`,
    };
  }

  // 3) 没抓到事件：Deposit 允许退化用 tx.value；Withdraw 不允许（必失败）
  if (type === "Withdraw") {
    return {
      ok: false,
      expectedAmountEth,
      actualAmountEth: "0",
      source: "none",
      reason: `Withdraw must have Withdraw event; none found`,
    };
  }

  const tx = await provider.getTransaction(txHash);
  if (!tx) {
    return {
      ok: false,
      expectedAmountEth,
      actualAmountEth: "0",
      source: "none",
      reason: `tx not found: ${txHash}`,
    };
  }

  const actualWei = tx.value ?? ethers.constants.Zero;
  const ok = actualWei.eq(expectedWei);

  return {
    ok,
    expectedAmountEth,
    actualAmountEth: ethers.utils.formatEther(actualWei),
    source: "tx.value",
    reason: ok ? undefined : `tx.value != expected`,
  };
}

/**
 * ✅ 可选：Withdraw 状态差校验（你截图里已经在写这个）
 * 说明：你如果已经有同名函数，就保留它；没有的话可以用这个版本
 */
export type VerifyWithdrawStateArgs = {
  provider: ethers.providers.Provider;
  contract: ethers.Contract;
  user: string;
  expectedAmountWei: ethers.BigNumber;
  txHash: string;
};

export async function verifyWithdrawState(args: VerifyWithdrawStateArgs) {
  const { provider, contract, user, expectedAmountWei, txHash } = args;
  assertAddress(user, "user");

  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) throw new Error(`tx receipt not found: ${txHash}`);
  if (receipt.status !== 1) throw new Error(`tx reverted: ${txHash}`);

  const blockNow = receipt.blockNumber;
  const blockPrev = Math.max(0, blockNow - 1);

  const before = await (contract as any).balances(user, { blockTag: blockPrev });
  const after = await (contract as any).balances(user, { blockTag: blockNow });

  const delta = before.sub(after);
  const ok = delta.eq(expectedAmountWei);

  return { ok, before, after, delta, expectedAmountWei, blockPrev, blockNow };
}