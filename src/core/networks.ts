// web3-toolkit/src/core/networks.ts（示例结构，按你文件里的结构放）
export const NETWORKS = {
  local: {
    chainId: 31337,
    rpcUrl: "http://127.0.0.1:8545/",
    Lesson8_EventsBank: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  },
  // ... other networks
} as const;