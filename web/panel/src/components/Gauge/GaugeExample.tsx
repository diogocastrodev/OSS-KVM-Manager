"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useMemo, useRef, useState } from "react";
import "chart.js/auto";
import type { ChartOptions, Plugin } from "chart.js";

const Doughnut = dynamic(
  () => import("react-chartjs-2").then((m) => m.Doughnut),
  { ssr: false },
);

type Thresholds = { good: number; warn: number };

type Colors = {
  good: string;
  warn: string;
  bad: string;
  track: string;
  border: string;
  label: string; // center label color
};

type SemiGaugeProps = {
  title?: string;
  label: string;

  value: number;
  max: number;

  higherIsBetter?: boolean;
  thresholds?: Thresholds;

  /** Can be plain colors or CSS vars like "var(--color-success)" */
  colors?: Partial<Colors>;

  format?: "percent" | "ratio";
  precision?: number;
  unit?: string;

  /** Layout */
  height?: number;
  className?: string;

  /** Text sizing (lower = smaller) */
  valueTextScale?: number; // default 0.26
  labelTextScale?: number; // default 0.14

  /** If your theme toggles by changing html/body class or data-theme, keep this true */
  watchTheme?: boolean;
};

/** Canvas can't use var(--x) directly; resolve to computed color. */
function resolveCssColor(input: string, scopeEl: HTMLElement | null): string {
  if (typeof window === "undefined") return input;
  const t = input.trim();
  if (!t.startsWith("var(")) return t;

  const inside = t.slice(4, -1).trim(); // --token, fallback
  const [varNameRaw, fallbackRaw] = inside.split(",").map((s) => s.trim());

  const el = scopeEl ?? document.documentElement;
  const computed = getComputedStyle(el).getPropertyValue(varNameRaw).trim();
  return computed || fallbackRaw || input;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startPx: number,
  minPx: number,
  weight: number,
) {
  let size = startPx;
  const family =
    "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif";
  while (size > minPx) {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 1;
  }
  return size;
}

const centerTextPlugin: Plugin<"doughnut"> = {
  id: "centerText",
  beforeDraw(chart, _args, opts: any) {
    const meta = chart.getDatasetMeta(0);
    const arc: any = meta?.data?.[0];
    if (!arc) return;

    const { ctx } = chart;
    const x = arc.x;
    const y = arc.y;

    const innerR = arc.innerRadius ?? arc.outerRadius * 0.7;
    const outerR = arc.outerRadius ?? innerR / 0.7;

    const maxTextWidth = innerR * 2 * 0.92;

    const label = String(opts?.label ?? "");
    let valueText = String(opts?.valueText ?? "");

    const valueColor = opts?.valueColor ?? "#22c55e";
    const labelColor = opts?.labelColor ?? "rgba(255,255,255,0.55)";

    // Scale knobs
    const valueScale = Number(opts?.valueScale ?? 0.26);
    const labelScale = Number(opts?.labelScale ?? 0.14);

    const startValuePx = clamp(innerR * valueScale, 14, 34);
    const startLabelPx = clamp(innerR * labelScale, 10, 16);

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // If too wide and contains '/', wrap to 2 lines
    ctx.font = `800 ${startValuePx}px system-ui`;
    const tooWide = ctx.measureText(valueText).width > maxTextWidth;

    let valueLines: string[] = [valueText];
    if (tooWide && valueText.includes("/")) {
      const [a, b] = valueText.split("/");
      valueLines = [a.trim(), `/${b.trim()}`];
    }

    const valueSizes = valueLines.map((line) =>
      fitFontSize(ctx, line, maxTextWidth, startValuePx, 12, 800),
    );

    const labelPx = fitFontSize(ctx, label, maxTextWidth, startLabelPx, 9, 600);

    const lineGap = Math.max(4, innerR * 0.06);

    let yLift = outerR * 0.26;

    const area = chart.chartArea;
    const margin = 6;

    // ✅ CHANGE THIS to push label lower/higher
    const baseY0 = y - outerR * 0.1; // try 0.08 (lower) or 0.14 (higher)

    // keep label inside chart area
    const labelY = clamp(
      baseY0,
      area.top + margin + labelPx / 2,
      area.bottom - margin - labelPx / 2,
    );

    // height of value lines (with gaps between them)
    const valueBlockHeight =
      valueSizes.reduce((a, b) => a + b, 0) + lineGap * (valueLines.length - 1);

    // total block: values + gap + label
    const blockHeight = valueBlockHeight + lineGap + labelPx;

    // top cursor so label ends at labelY
    let topCursor0 = labelY + labelPx / 2 - blockHeight;

    // clamp whole block
    const topLimit = area.top + margin;
    const bottomLimit = area.bottom - margin;

    let shift = 0;
    if (topCursor0 < topLimit) shift = topLimit - topCursor0;

    const bottomOfBlock = topCursor0 + shift + blockHeight;
    if (bottomOfBlock > bottomLimit) shift -= bottomOfBlock - bottomLimit;

    let topCursor = topCursor0 + shift;

    // draw value lines
    ctx.fillStyle = valueColor;
    for (let i = 0; i < valueLines.length; i++) {
      const px = valueSizes[i];
      ctx.font = `800 ${px}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
      ctx.fillText(valueLines[i], x, topCursor + px / 2);
      topCursor += px;
      if (i < valueLines.length - 1) topCursor += lineGap;
    }

    // gap then label (stuck near bottom)
    topCursor += lineGap;

    ctx.fillStyle = labelColor;
    ctx.font = `600 ${labelPx}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
    ctx.fillText(label, x, topCursor + labelPx / 2);

    ctx.restore();
  },
};

export default function SemiGauge({
  title,
  label,
  value,
  max,
  higherIsBetter = false,
  thresholds = { good: 60, warn: 85 },
  colors,
  format = "ratio",
  precision = 2,
  unit,
  height = 220,
  className = "w-full",
  valueTextScale = 0.23, // smaller by default
  labelTextScale = 0.13, // smaller by default
  watchTheme = true,
}: SemiGaugeProps) {
  const [displayVal, setDisplayVal] = useState(0);

  const wrapRef = useRef<HTMLDivElement | null>(null);

  const safeMax = max > 0 ? max : 1;
  const clampedVal = Math.max(0, Math.min(value, safeMax));
  const pct = (clampedVal / safeMax) * 100;

  useEffect(() => {
    // start at 0, then animate to real value next frame
    setDisplayVal(0);
    const id = requestAnimationFrame(() => setDisplayVal(clampedVal));
    return () => cancelAnimationFrame(id);
  }, [clampedVal]);

  const status: "good" | "warn" | "bad" = useMemo(() => {
    const g = clamp(thresholds.good, 0, 100);
    const w = clamp(thresholds.warn, 0, 100);

    if (!higherIsBetter) {
      if (pct <= g) return "good";
      if (pct <= w) return "warn";
      return "bad";
    } else {
      if (pct >= g) return "good";
      if (pct >= w) return "warn";
      return "bad";
    }
  }, [pct, thresholds.good, thresholds.warn, higherIsBetter]);

  const [themeTick, setThemeTick] = useState(0);

  const [resolved, setResolved] = useState<Required<Colors>>({
    good: "#22c55e",
    warn: "#f59e0b",
    bad: "#ef4444",
    track: "#2b2f33",
    border: "rgba(255,255,255,0.12)",
    label: "rgba(255,255,255,0.55)",
  });

  const resolveAll = () => {
    const el = wrapRef.current;
    const next: Required<Colors> = {
      good: resolveCssColor(colors?.good ?? "#22c55e", el),
      warn: resolveCssColor(colors?.warn ?? "#f59e0b", el),
      bad: resolveCssColor(colors?.bad ?? "#ef4444", el),
      track: resolveCssColor(colors?.track ?? "#2b2f33", el),
      border: resolveCssColor(colors?.border ?? "rgba(255,255,255,0.12)", el),
      label: resolveCssColor(colors?.label ?? "rgba(255,255,255,0.55)", el),
    };

    setResolved((prev) => {
      const changed =
        prev.good !== next.good ||
        prev.warn !== next.warn ||
        prev.bad !== next.bad ||
        prev.track !== next.track ||
        prev.border !== next.border ||
        prev.label !== next.label;

      // bump key to force full remount if theme colors changed
      if (changed) setThemeTick((t) => t + 1);
      return changed ? next : prev;
    });
  };

  // Resolve on mount + whenever color strings change
  useEffect(() => {
    resolveAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    colors?.good,
    colors?.warn,
    colors?.bad,
    colors?.track,
    colors?.border,
    colors?.label,
  ]);

  // Watch for theme toggles (html/body class or data-theme changes)
  useEffect(() => {
    if (!watchTheme || typeof window === "undefined") return;

    const targets = [document.documentElement, document.body].filter(Boolean);
    const obs = new MutationObserver(() => resolveAll());

    targets.forEach((t) =>
      obs.observe(t, {
        attributes: true,
        attributeFilter: ["class", "style", "data-theme", "data-mode"],
      }),
    );

    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    watchTheme,
    colors?.good,
    colors?.warn,
    colors?.bad,
    colors?.track,
    colors?.border,
    colors?.label,
  ]);

  const fill =
    status === "good"
      ? resolved.good
      : status === "warn"
        ? resolved.warn
        : resolved.bad;

  const valueText =
    format === "percent"
      ? `${pct.toFixed(precision)} %`
      : `${displayVal}${unit ? ` ${unit}` : ""}/${safeMax}${unit ? ` ${unit}` : ""}`;

  const data = [displayVal, Math.max(0, safeMax - displayVal)];

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    circumference: 180,
    rotation: 270,
    cutout: "76%", // more space for text than 65%
    animation: { duration: 500 },
    transitions: {
      active: {
        animation: {
          duration: 150, // disable hover grow animation
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
      // @ts-expect-error custom plugin options
      centerText: {
        valueText,
        label,
        valueColor: fill,
        labelColor: resolved.label,
        valueScale: valueTextScale,
        labelScale: labelTextScale,
      },
    },
  };

  return (
    <div ref={wrapRef} className={`flex flex-col items-center ${className}`}>
      {title ? <h2 className="text-3xl font-semibold mb-2">{title}</h2> : null}

      <div className="w-full" style={{ height }}>
        {/* key forces remount when theme colors actually change */}
        <Doughnut
          key={themeTick}
          plugins={[centerTextPlugin]}
          data={{
            labels: ["value", "remainder"],
            datasets: [
              {
                data,
                backgroundColor: [fill, resolved.track],
                borderColor: resolved.border,
                borderWidth: 2,
                borderRadius: 10,
                hoverOffset: 6,
              },
            ],
          }}
          options={options}
        />
      </div>
    </div>
  );
}
