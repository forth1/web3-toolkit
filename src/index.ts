// =======================
// abis
// =======================
import BankJson from "./abi/Bank.json";
import MyTokenJson from "./abi/MyToken.json";

// ✅ ABI 导出为 any：避免 tsup 把 JSON “内联进 dist/index.d.ts” 导致 .d.ts 报错
export const BankABI: any = BankJson as any;
export const MyTokenABI: any = MyTokenJson as any;

// =======================
// bank utils
// =======================
export * from "./bank/getBankContract";
export * from "./bank/getBalance";

// ✅ 生产级交易金额 / 状态校验
export * from "./bank/verifyTxAmount";

// =======================
// core utils
// =======================
export * from "./core/ethereum";
export * from "./core/networks";
export * from "./core/number-utils";
export * from "./core/formatAddress";

// =======================
// react hooks
// =======================
export * from "./hooks/useWallet";

// ❗ 显式导出（避免 export * 在 tsup / DTS / 重导出时丢符号）
export { useBankApp } from "./hooks/useBankApp";