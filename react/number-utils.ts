// hooks/useMyHook.ts
import { useState, useEffect } from "react";

export function useMyHook() {
  const [data, setData] = useState<string | null>(null);

  useEffect(() => {
    // 这里以后写你的逻辑，比如：
    // setData("hello web3");
  }, []);

  return { data };
}
