import { useEffect, useMemo, useState } from "react";

type Options = {
  /**
   * Pixels above this brightness (0-255) are treated as background and made transparent.
   * Default targets common white/very-light checkerboard squares.
   */
  bgBrightnessThreshold?: number;
  /**
   * Also treat near-neutral grays as background (checkerboard darker squares).
   */
  neutralGrayMaxDelta?: number;
  /**
   * Gray brightness range to consider background when pixel is near-neutral.
   */
  neutralGrayMin?: number;
  neutralGrayMax?: number;
};

/**
 * Removes baked-in checkerboard / light background pixels from an image by
 * converting very bright and near-neutral gray pixels to alpha=0.
 *
 * NOTE: This is intentionally heuristic, tailored for the hand PNGs where the
 * background is a light checkerboard.
 */
export function useTransparentPng(src: string, options: Options = {}) {
  const {
    bgBrightnessThreshold = 210,
    neutralGrayMaxDelta = 18,
    neutralGrayMin = 150,
    neutralGrayMax = 255,
  } = options;

  const key = useMemo(
    () =>
      `${src}::${bgBrightnessThreshold}::${neutralGrayMaxDelta}::${neutralGrayMin}::${neutralGrayMax}`,
    [
      src,
      bgBrightnessThreshold,
      neutralGrayMaxDelta,
      neutralGrayMin,
      neutralGrayMax,
    ]
  );

  const [processedSrc, setProcessedSrc] = useState<string>(src);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    const img = new Image();
    // local assets are same-origin; keep this for safety if the bundler serves with CORS
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.src = src;

    img.onload = async () => {
      if (cancelled) return;

      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      if (!w || !h) return;

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // brightness approx
        const brightness = (r + g + b) / 3;

        // near-neutral gray check
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const nearNeutral = max - min <= neutralGrayMaxDelta;

        // 1) wipe bright pixels (white squares)
        // 2) wipe near-neutral grays in a typical checker range
        const isBackground =
          brightness >= bgBrightnessThreshold ||
          (nearNeutral && brightness >= neutralGrayMin && brightness <= neutralGrayMax);

        if (isBackground) {
          data[i + 3] = 0; // alpha
        }
      }

      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (cancelled) return;
          if (!blob) return;
          objectUrl = URL.createObjectURL(blob);
          setProcessedSrc(objectUrl);
        },
        "image/png",
        1
      );
    };

    img.onerror = () => {
      if (!cancelled) setProcessedSrc(src);
    };

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // key is the stable dependency that captures src + options
  }, [key, src]);

  return processedSrc;
}
