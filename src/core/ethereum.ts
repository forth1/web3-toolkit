export type Ethereumish = {
  request?: (args: { method: string; params?: any[] | object }) => Promise<any>;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (event: string, handler: (...args: any[]) => void) => void;
  providers?: any[];
  isMetaMask?: boolean;
};

function wrapRequestDebug(eth: Ethereumish): Ethereumish {
  if (!eth?.request) return eth;

  const anyEth = eth as any;
  if (anyEth.__wrapped_request__) return eth;

  const original = eth.request.bind(eth);

  // ✅ 简单节流：同一个 (method + selector + to) 200ms 内只打印一次
  const lastLogAt = new Map<string, number>();
  const canLog = (key: string) => {
    const now = Date.now();
    const prev = lastLogAt.get(key) ?? 0;
    if (now - prev < 200) return false;
    lastLogAt.set(key, now);
    return true;
  };

  eth.request = async (args) => {
    try {
      const method = args?.method;

      if (method === "eth_call" || method === "eth_estimateGas" || method === "eth_sendTransaction") {
        const p: any = Array.isArray(args.params) ? args.params[0] : undefined;
        const data: string | undefined = p?.data;
        const to: string | undefined = p?.to;

        const selector =
          typeof data === "string" && data.startsWith("0x") ? data.slice(0, 10) : data;

        const key = `${method}|${selector ?? "no-data"}|${to ?? "no-to"}`;

        if (canLog(key)) {
          console.log(`[${method}]`, { selector, to });
          console.log(new Error(`[${method} stack]`).stack);
        }
      }
    } catch {
      // ignore debug failures
    }

    return original(args);
  };

  anyEth.__wrapped_request__ = true;
  return eth;
}

export function getEthereum(): Ethereumish | null {
  const eth: any = (globalThis as any).ethereum;
  if (!eth) return null;

  const providers: any[] | undefined = Array.isArray(eth.providers) ? eth.providers : undefined;

  let chosen: any = eth;
  if (providers?.length) {
    const mm = providers.find((p) => p?.isMetaMask);
    chosen = mm ?? providers[0] ?? eth;
  }

  // ✅ 只在你手动打开时才启用（浏览器控制台设置）
  // window.__WEB3_TOOLKIT_DEBUG__ = true
  const debugOn = !!(globalThis as any).__WEB3_TOOLKIT_DEBUG__;
  return debugOn ? wrapRequestDebug(chosen) : chosen;
}