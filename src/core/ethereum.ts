// src/core/ethereum.ts
export type Ethereumish = {
  request?: (args: { method: string; params?: any[] | object }) => Promise<any>;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (event: string, handler: (...args: any[]) => void) => void;
};

export function getEthereum(): Ethereumish | undefined {
  return (globalThis as any)?.ethereum;
}