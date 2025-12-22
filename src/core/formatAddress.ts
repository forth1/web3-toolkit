// src/core/formatAddress.ts
export function formatAddress(addr?: string | null, front = 6, back = 4) {
  if (!addr) return "";
  if (addr.length <= front + back) return addr;
  return `${addr.slice(0, front)}...${addr.slice(-back)}`;
}