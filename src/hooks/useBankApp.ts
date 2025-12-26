// src/hooks/useBankApp.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ethers } from "ethers";
import { getBankContract } from "../bank/getBankContract";
import { formatAddress } from "../core/formatAddress";
import { getEthereum } from "../core/ethereum";

// ✅ 交易金额校验（你已经加了这个文件）
import { verifyBankTxAmount } from "../bank/verifyTxAmount";

export type BankEventType = "Deposit" | "Withdraw";

export interface BankEventItem {
  id: string;
  type: BankEventType;
  user: string;
  amountEth: string;
  txHash: string;
  blockNumber: number;
}

export interface BankAppState {
  account: string | null;
  shortAccount: string;
  walletEth: string;
  bankEth: string;
  events: BankEventItem[];
  loading: boolean;
  error: string | null;
  txHash: string | null;

  // ✅ Bank 模块是否启用（v12 阶段可彻底关闭 Bank）
  enabled: boolean;
}

export interface UseBankAppOptions {
  enabled?: boolean; // default true
}

export interface UseBankAppResult extends BankAppState {
  connect: () => Promise<void>;
  refresh: (force?: boolean) => Promise<void>;
  deposit: (amountEth: string) => Promise<ethers.ContractTransaction>;
  withdraw: (amountEth: string) => Promise<ethers.ContractTransaction>;
  clearError: () => void;
  clearEvents: () => void;
}

function normalizeEthersError(e: any): string {
  const code = e?.code;
  if (code === "ACTION_REJECTED" || code === 4001) return "你已取消钱包确认";
  return (
    e?.reason ||
    e?.data?.message ||
    e?.error?.message ||
    e?.message ||
    "Unknown error"
  );
}

function isValidAddress(addr: any): addr is string {
  return (
    typeof addr === "string" &&
    ethers.utils.isAddress(addr) &&
    addr !== ethers.constants.AddressZero
  );
}

function bnEq(a: ethers.BigNumber, b: ethers.BigNumber) {
  return a.eq(b);
}

function bnSub(a: ethers.BigNumber, b: ethers.BigNumber) {
  return a.sub(b);
}

/**
 * ✅ Withdraw 状态校验（生产级）：
 * - 用 receipt.blockNumber 精确定位“本块”和“上一块”的 balances(addr)
 * - 校验 before - after === expectedAmountWei
 *
 * 注意：
 * - Withdraw 的 tx.value 一定是 0，所以必须靠事件 + 状态差来确认
 */
async function verifyWithdrawStateDelta(params: {
  provider: ethers.providers.Provider;
  contract: ethers.Contract;
  account: string;
  receipt: ethers.providers.TransactionReceipt;
  expectedAmountWei: ethers.BigNumber;
}) {
  const { provider, contract, account, receipt, expectedAmountWei } = params;

  const blockNow = receipt.blockNumber;
  const blockPrev = Math.max(0, blockNow - 1);

  let before = ethers.constants.Zero;
  let after = ethers.constants.Zero;

  try {
    before = await (contract as any).balances(account, { blockTag: blockPrev });
  } catch {
    before = await (contract as any).balances(account);
  }

  try {
    after = await (contract as any).balances(account, { blockTag: blockNow });
  } catch {
    after = await (contract as any).balances(account);
  }

  const delta = bnSub(before, after);
  const ok = bnEq(delta, expectedAmountWei);

  return { ok, before, after, delta, expectedAmountWei, blockPrev, blockNow };
}

export function useBankApp(options?: UseBankAppOptions): UseBankAppResult {
  // ✅ enabled 开关（默认 true）
  const enabled = options?.enabled ?? true;

  const [account, setAccount] = useState<string | null>(null);
  const [walletEth, setWalletEth] = useState("0");
  const [bankEth, setBankEth] = useState("0");
  const [events, setEvents] = useState<BankEventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const shortAccount = useMemo(() => formatAddress(account), [account]);

  const clearError = useCallback(() => setError(null), []);
  const clearEvents = useCallback(() => setEvents([]), []);

  // ✅ 并发保护：只有最后一次请求允许 setState
  const reqIdRef = useRef(0);
  const nextReqId = () => ++reqIdRef.current;
  const isLatest = (id: number) => id === reqIdRef.current;

  // ✅ refresh 合并/单飞：同一时刻只允许 1 个 snapshot 在跑
  const inflightSnapshotRef = useRef<Promise<void> | null>(null);
  const lastRefreshAtRef = useRef<number>(0);
  const REFRESH_MIN_INTERVAL_MS = 500;

  // ✅ 防重放（交易级别）：同一时刻只允许 1 笔 deposit/withdraw 在跑
  const depositInFlightRef = useRef(false);
  const withdrawInFlightRef = useRef(false);

  // ✅ 防重复处理同一个 txHash（比如 StrictMode/重复点击导致逻辑跑两次）
  const processedTxRef = useRef<Set<string>>(new Set());

  const getAuthorizedAccount = useCallback(async () => {
    const eth = getEthereum();
    if (!eth?.request) return null;
    const accs: string[] = await eth.request({ method: "eth_accounts" });
    return accs?.[0] ?? null;
  }, []);

  const requestAccounts = useCallback(async () => {
    const eth = getEthereum();
    if (!eth?.request) throw new Error("No wallet");
    const accs: string[] = await eth.request({ method: "eth_requestAccounts" });
    if (!accs?.[0]) throw new Error("No account");
    return accs[0];
  }, []);

  /**
   * ✅ 统一快照：
   * - enabled=true  -> 读 wallet + bank + events（会用 getBankContract）
   * - enabled=false -> 只读 wallet（Web3Provider.getBalance），完全不碰 bank 合约
   */
  const fetchSnapshot = useCallback(
    async (addr: string) => {
      if (!isValidAddress(addr)) throw new Error("invalid address");

      // --- 1) 先拿钱包余额（无论 enabled 与否都可用）---
      const eth = getEthereum();
      if (!eth) throw new Error("No wallet");

      const walletProvider = new ethers.providers.Web3Provider(eth as any);
      const walletBN = await walletProvider.getBalance(addr);

      // enabled=false：到此为止，不再碰 Bank
      if (!enabled) {
        return {
          walletEth: ethers.utils.formatEther(walletBN),
          bankEth: "0",
          events: [] as BankEventItem[],
        };
      }

      // --- 2) enabled=true：才去拿 Bank 合约/事件 ---
      const { provider, contract } = await getBankContract();

      const latestBlock = await provider.getBlockNumber();

      let bankBN = ethers.constants.Zero;
      try {
        bankBN = await (contract as any).balances(addr);
      } catch {
        bankBN = ethers.constants.Zero;
      }

      const fromBlock = Math.max(0, latestBlock - 5000);

      let merged: BankEventItem[] = [];
      try {
        const [deps, wds] = await Promise.all([
          (contract as any).queryFilter(
            (contract as any).filters.Deposit(),
            fromBlock,
            latestBlock
          ),
          (contract as any).queryFilter(
            (contract as any).filters.Withdraw(),
            fromBlock,
            latestBlock
          ),
        ]);

        const parse = (log: any, type: BankEventType): BankEventItem => ({
          id: `${log.transactionHash}-${log.logIndex}`,
          type,
          user: (log.args?.user ?? "") as string,
          amountEth: ethers.utils.formatEther(log.args?.amount ?? 0),
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
        });

        merged = [
          ...deps.map((l: any) => parse(l, "Deposit")),
          ...wds.map((l: any) => parse(l, "Withdraw")),
        ]
          .reduce<BankEventItem[]>((acc, cur) => {
            if (acc.find((x) => x.id === cur.id)) return acc;
            acc.push(cur);
            return acc;
          }, [])
          .sort((a, b) => b.blockNumber - a.blockNumber)
          .slice(0, 50);
      } catch {
        merged = [];
      }

      return {
        walletEth: ethers.utils.formatEther(walletBN),
        bankEth: ethers.utils.formatEther(bankBN),
        events: merged,
      };
    },
    [enabled]
  );

  const refreshByAccount = useCallback(
    async (addr: string, force = false) => {
      const now = Date.now();

      if (inflightSnapshotRef.current) return inflightSnapshotRef.current;

      if (!force) {
        if (now - lastRefreshAtRef.current < REFRESH_MIN_INTERVAL_MS) return;
        lastRefreshAtRef.current = now;
      } else {
        lastRefreshAtRef.current = now;
      }

      const rid = nextReqId();

      const p = (async () => {
        try {
          const snap = await fetchSnapshot(addr);
          if (!isLatest(rid)) return;

          setWalletEth(snap.walletEth);

          // enabled=false 时 snap.bankEth/events 是 0/[]
          setBankEth(snap.bankEth);
          setEvents(snap.events);
        } finally {
          inflightSnapshotRef.current = null;
        }
      })();

      inflightSnapshotRef.current = p;
      return p;
    },
    [fetchSnapshot]
  );

  const connect = useCallback(async () => {
    // ✅ 即使 enabled=false，也允许 connect（方便你 Token/统一 provider 用）
    setLoading(true);
    setError(null);
    setTxHash(null);

    const rid = nextReqId();

    try {
      const addr = await requestAccounts();
      if (!isLatest(rid)) return;

      setAccount(addr);
      await refreshByAccount(addr, true);
    } catch (e: any) {
      if (!isLatest(rid)) return;
      setError(normalizeEthersError(e));
    } finally {
      if (isLatest(rid)) setLoading(false);
    }
  }, [requestAccounts, refreshByAccount]);

  const refresh = useCallback(
    async (force = false) => {
      setLoading(true);
      setError(null);

      const rid = nextReqId();

      try {
        const addr = account ?? (await getAuthorizedAccount());

        if (!addr) {
          if (!isLatest(rid)) return;
          setAccount(null);

          // 没授权时也把数据清掉（尤其 enabled=true 的事件）
          setBankEth("0");
          setEvents([]);
          setTxHash(null);
          return;
        }

        if (!isLatest(rid)) return;

        setAccount(addr);
        await refreshByAccount(addr, force);
      } catch (e: any) {
        if (!isLatest(rid)) return;
        setError(normalizeEthersError(e));
      } finally {
        if (isLatest(rid)) setLoading(false);
      }
    },
    [account, getAuthorizedAccount, refreshByAccount]
  );

  const deposit = useCallback(
    async (amountEth: string) => {
      if (!enabled) {
        const msg = "Bank disabled (v12 stage)";
        setError(msg);
        throw new Error(msg);
      }

      if (depositInFlightRef.current) {
        const msg = "Deposit 正在进行中，请等待上一笔完成";
        setError(msg);
        throw new Error(msg);
      }

      depositInFlightRef.current = true;

      setLoading(true);
      setError(null);
      setTxHash(null);

      const rid = nextReqId();

      try {
        const addr = account ?? (await requestAccounts());
        if (!isLatest(rid)) throw new Error("Stale request");
        setAccount(addr);

        const { provider, contract } = await getBankContract();

        const tx: ethers.ContractTransaction = await (contract as any).deposit({
          value: ethers.utils.parseEther(amountEth),
        });

        if (isLatest(rid)) setTxHash(tx.hash);

        await tx.wait();

        if (processedTxRef.current.has(tx.hash)) return tx;
        processedTxRef.current.add(tx.hash);

        const v = await verifyBankTxAmount({
          provider,
          contract,
          txHash: tx.hash,
          type: "Deposit",
          expectedAmountEth: amountEth,
        });

        if (!v.ok) {
          const msg = `Deposit 金额校验失败：expected=${v.expectedAmountEth}, actual=${v.actualAmountEth}, source=${v.source}. ${v.reason ?? ""}`;
          if (isLatest(rid)) setError(msg);
          throw new Error(msg);
        }

        if (isLatest(rid)) await refreshByAccount(addr, true);

        return tx;
      } catch (e: any) {
        if (isLatest(rid)) setError(normalizeEthersError(e));
        throw e;
      } finally {
        depositInFlightRef.current = false;
        if (isLatest(rid)) setLoading(false);
      }
    },
    [enabled, account, requestAccounts, refreshByAccount]
  );

  const withdraw = useCallback(
    async (amountEth: string) => {
      if (!enabled) {
        const msg = "Bank disabled (v12 stage)";
        setError(msg);
        throw new Error(msg);
      }

      if (withdrawInFlightRef.current) {
        const msg = "Withdraw 正在进行中，请等待上一笔完成";
        setError(msg);
        throw new Error(msg);
      }

      withdrawInFlightRef.current = true;

      setLoading(true);
      setError(null);
      setTxHash(null);

      const rid = nextReqId();

      try {
        const addr = account ?? (await requestAccounts());
        if (!isLatest(rid)) throw new Error("Stale request");
        setAccount(addr);

        const { provider, contract } = await getBankContract();

        const expectedWei = ethers.utils.parseEther(amountEth);

        const tx: ethers.ContractTransaction = await (contract as any).withdraw(
          expectedWei
        );

        if (isLatest(rid)) setTxHash(tx.hash);

        const receipt = await tx.wait();

        if (processedTxRef.current.has(tx.hash)) return tx;
        processedTxRef.current.add(tx.hash);

        const v = await verifyBankTxAmount({
          provider,
          contract,
          txHash: tx.hash,
          type: "Withdraw",
          expectedAmountEth: amountEth,
        });

        if (!v.ok) {
          const msg = `Withdraw 金额校验失败：expected=${v.expectedAmountEth}, actual=${v.actualAmountEth}, source=${v.source}. ${v.reason ?? ""}`;
          if (isLatest(rid)) setError(msg);
          throw new Error(msg);
        }

        const s = await verifyWithdrawStateDelta({
          provider,
          contract,
          account: addr,
          receipt,
          expectedAmountWei: expectedWei,
        });

        if (!s.ok) {
          const msg = `Withdraw 状态校验失败：before=${ethers.utils.formatEther(
            s.before
          )}, after=${ethers.utils.formatEther(
            s.after
          )}, delta=${ethers.utils.formatEther(
            s.delta
          )}, expected=${amountEth}. (blockPrev=${s.blockPrev}, blockNow=${s.blockNow})`;
          if (isLatest(rid)) setError(msg);
          throw new Error(msg);
        }

        if (isLatest(rid)) await refreshByAccount(addr, true);

        return tx;
      } catch (e: any) {
        if (isLatest(rid)) setError(normalizeEthersError(e));
        throw e;
      } finally {
        withdrawInFlightRef.current = false;
        if (isLatest(rid)) setLoading(false);
      }
    },
    [enabled, account, requestAccounts, refreshByAccount]
  );

  // ✅ 首刷：enabled=true/false 都可以刷（false 只刷 wallet，不会碰 bank）
  useEffect(() => {
    refresh(true).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ 监听：enabled=true/false 都监听（false 只会刷新 wallet，不会碰 bank）
  useEffect(() => {
    const eth = getEthereum();
    if (!eth?.on) return;

    const onAccountsChanged = (accs: string[]) => {
      const addr = accs?.[0] ?? null;
      nextReqId();

      setAccount(addr);
      setTxHash(null);
      setError(null);

      if (!addr) {
        setBankEth("0");
        setEvents([]);
        return;
      }

      refreshByAccount(addr, true).catch(() => {});
    };

    const onChainChanged = () => {
      nextReqId();
      setTxHash(null);
      setError(null);
      refresh(true).catch(() => {});
    };

    eth.on("accountsChanged", onAccountsChanged);
    eth.on("chainChanged", onChainChanged);

    return () => {
      eth.removeListener?.("accountsChanged", onAccountsChanged);
      eth.removeListener?.("chainChanged", onChainChanged);
    };
  }, [refresh, refreshByAccount]);

  // ✅ enabled 切换：当关闭 Bank 时，清空 Bank 残留
  useEffect(() => {
    if (enabled) return;

    nextReqId();
    inflightSnapshotRef.current = null;

    depositInFlightRef.current = false;
    withdrawInFlightRef.current = false;

    setBankEth("0");
    setEvents([]);
    setTxHash(null);
    setError(null);
  }, [enabled]);

  return {
    account,
    shortAccount,
    walletEth,
    bankEth,
    events,
    loading,
    error,
    txHash,
    enabled,
    connect,
    refresh,
    deposit,
    withdraw,
    clearError,
    clearEvents,
  };
}

export default useBankApp;