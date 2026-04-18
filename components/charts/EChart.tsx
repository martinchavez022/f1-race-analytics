"use client";

import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

interface EChartProps {
  option: EChartsOption;
  className?: string;
  style?: React.CSSProperties;
}

export function EChart({ option, className, style }: EChartProps) {
  return (
    <ReactECharts
      option={option}
      className={className}
      style={{ height: 400, width: "100%", ...style }}
      notMerge
      lazyUpdate
    />
  );
}
