import { useState, useEffect } from "react";

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";

const CACHE_KEY = "eth_price_cache";
const CACHE_TTL = 60_000; // 1 minute

interface CacheEntry {
  price: number;
  timestamp: number;
}

function getCached(): number | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp < CACHE_TTL) return entry.price;
  } catch {}
  return null;
}

function setCache(price: number) {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ price, timestamp: Date.now() })
    );
  } catch {}
}

export function useEthPrice() {
  const [price, setPrice] = useState<number | null>(getCached);
  const [loading, setLoading] = useState(!getCached());

  useEffect(() => {
    const cached = getCached();
    if (cached) {
      setPrice(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    fetch(COINGECKO_URL)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const p = data?.ethereum?.usd;
        if (typeof p === "number") {
          setPrice(p);
          setCache(p);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { price, loading };
}
