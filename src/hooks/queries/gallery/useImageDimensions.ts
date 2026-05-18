import { useEffect, useState } from "react";

/**
 * Lazily measures the natural width/height of each image URL.
 * Returns a map keyed by URL. Missing entries mean "not yet loaded".
 */
export function useImageDimensions(urls: string[]) {
  const [dims, setDims] = useState<Record<string, { width: number; height: number }>>({});

  useEffect(() => {
    let cancelled = false;
    const missing = urls.filter((u) => u && !dims[u]);
    missing.forEach((url) => {
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        setDims((prev) =>
          prev[url]
            ? prev
            : { ...prev, [url]: { width: img.naturalWidth, height: img.naturalHeight } },
        );
      };
      img.src = url;
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urls.join("|")]);

  return dims;
}
