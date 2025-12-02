// react/formatAddress.ts
export function formatAddress(address?: string | null, size: number = 4): string {
  if (!address) return "";
  const addr = address.toString();
  if (addr.length <= size * 2) return addr;
  const head = addr.slice(0, 2 + size); // 0x + 前 size 位
  const tail = addr.slice(-size);
  return `${head}...${tail}`;
}