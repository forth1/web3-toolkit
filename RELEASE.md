这是“发布说明 + 如何复现你的环境”的文档。复制下面：
# Release Notes

## v12.0.0-rc.1

This RC focuses on **ERC20 token support** and **frontend stability** via a **unified provider** approach.

### What’s included
- ERC20 token (MyToken) ABI export at `src/abi/MyToken.json`
- Token balance reading utility
- Recommended DApp integration pattern:
  - Wallet connected -> MetaMask provider
  - Wallet not connected -> local Hardhat RPC provider fallback
- Bank module guard:
  - Bank is disabled by default in this RC to avoid invalid contract calls when Bank is not deployed.

---

## Local dev quickstart (Hardhat)

### Terminal A: start local chain
```bash
# dir: web3-toolkit/
npx hardhat node
Terminal B: deploy token & export ABI
# dir: web3-toolkit/
npx hardhat run hardhat/scripts/deploy-token.js --network localhost
Expected output includes:
	•	MyToken deployed address
	•	ABI exported -> src/abi/MyToken.json
    Verify token
# dir: web3-toolkit/
npx hardhat run hardhat/scripts/check-token.js --network localhost
DApp integration (recommended)
Provider

Use a unified provider in your DApp:
	•	MetaMask provider when available
	•	Otherwise fallback to http://127.0.0.1:8545

Bank guard

If Bank contract is not deployed yet:
	•	keep BANK_ENABLED = false
	•	call useBankApp({ enabled: false })

This prevents repeated eth_call errors to an invalid Bank contract address.
---

## 3) README.md 追加一小段（建议放在 Usage 或 Examples）

把下面加到 README 的 “Usage / Examples” 里（没有就新建标题）：

```md
## v12 (ERC20) - Quick Example

### TokenBalance (read-only)
A minimal ERC20 balance read example:

- `tokenAddress`: deployed ERC20 contract address (Hardhat localhost example)
- `userAddress`: wallet address (or hardhat account #0 for demo)
- `provider`: unified provider (MetaMask when available, otherwise JsonRpcProvider)

> Tip: If you haven't deployed the Bank contract yet, keep Bank disabled:
> `useBankApp({ enabled: false })` to avoid invalid contract calls.