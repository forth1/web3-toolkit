# Changelog

## v12.0.0-rc.1

**Goal:** Introduce ERC20 token support and a stable frontend integration path (TokenBalance + unified provider).  
**Note:** Bank module is intentionally **disabled by default** in this RC to avoid invalid contract calls when Bank is not deployed.

### Added
- ERC20 ABI export: `src/abi/MyToken.json`
- Token utilities:
  - `src/token/getTokenBalance.ts`
- Token UI integration guidance (for downstream dapps):
  - TokenBalance component example + provider unification flow

### Changed
- `useBankApp` now supports `{ enabled: boolean }` option:
  - When disabled, it will not trigger any `eth_call` / account-chain listeners related to Bank.
- `src/index.ts` exports expanded for v12 token-related APIs/ABI.

### Fixed
- Build/DTS compatibility adjustments (ethers utils usage alignment / type fixes).

### Breaking / Behavior Notes
- If you didn’t deploy Bank contract, keep:
  - `useBankApp({ enabled: false })`
  - or set `BANK_ENABLED = false` in the demo DApp
  to prevent red errors caused by calling a non-existent Bank address.