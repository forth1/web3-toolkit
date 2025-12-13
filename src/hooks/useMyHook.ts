import { useState, useEffect } from "react";

export function useMyHook() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // your logic
  }, []);

  return { data };
}