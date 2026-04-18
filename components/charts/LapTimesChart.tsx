"use client";

import { EChart } from "./EChart";
import type { Driver, Lap } from "@/types/openf1";
import type { EChartsOption, LineSeriesOption } from "echarts";

interface LapTimesChartProps {
  drivers: Driver[];
  laps: Lap[];
}

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const rest = (s - m * 60).toFixed(3);
  return m > 0 ? `${m}:${rest.padStart(6, "0")}` : `${rest}s`;
}

export function LapTimesChart({ drivers, laps }: LapTimesChartProps) {
  const driversByNumber = new Map(drivers.map((d) => [d.driver_number, d]));

  const teammateStyle = new Map<number, "solid" | "dashed">();
  const byTeam = new Map<string, number[]>();
  for (const d of drivers) {
    const arr = byTeam.get(d.team_name) ?? [];
    arr.push(d.driver_number);
    byTeam.set(d.team_name, arr);
  }
  for (const nums of byTeam.values()) {
    [...nums]
      .sort((a, b) => a - b)
      .forEach((n, i) =>
        teammateStyle.set(n, i === 0 ? "solid" : "dashed"),
      );
  }

  const lapsByDriver = new Map<number, Lap[]>();
  for (const lap of laps) {
    const arr = lapsByDriver.get(lap.driver_number) ?? [];
    arr.push(lap);
    lapsByDriver.set(lap.driver_number, arr);
  }

  const sessionBest = laps.reduce<number | null>((best, l) => {
    if (l.lap_duration == null) return best;
    return best == null || l.lap_duration < best ? l.lap_duration : best;
  }, null);

  const series: LineSeriesOption[] = [];
  for (const [driverNumber, driverLaps] of lapsByDriver.entries()) {
    const driver = driversByNumber.get(driverNumber);
    if (!driver) continue;
    const sorted = [...driverLaps].sort(
      (a, b) => a.lap_number - b.lap_number,
    );
    const color = `#${driver.team_colour}`;
    series.push({
      name: `${driver.name_acronym} · ${driver.team_name}`,
      type: "line",
      showSymbol: false,
      symbol: "circle",
      symbolSize: 8,
      connectNulls: false,
      lineStyle: {
        color,
        width: 2,
        type: teammateStyle.get(driverNumber) ?? "solid",
      },
      itemStyle: { color },
      emphasis: {
        focus: "series",
        lineStyle: { width: 3.5 },
      },
      data: sorted.map(
        (l): [number, number | null] => [l.lap_number, l.lap_duration],
      ),
    });
  }

  if (series[0] && sessionBest != null) {
    series[0].markLine = {
      symbol: "none",
      silent: true,
      lineStyle: { color: "#f59e0b", type: "dashed", width: 1.5 },
      label: {
        formatter: `⚡ ${formatSeconds(sessionBest)}`,
        position: "insideStartTop",
        color: "#f59e0b",
        fontSize: 11,
        fontWeight: "bold",
      },
      data: [{ yAxis: sessionBest, name: "Session best" }],
    };
  }

  const option: EChartsOption = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross", lineStyle: { color: "#888" } },
      borderWidth: 0,
      backgroundColor: "rgba(24,24,27,0.95)",
      textStyle: { color: "#fff" },
      formatter: (raw) => {
        const params = raw as unknown as Array<{
          seriesName: string;
          color: string;
          value: [number, number | null];
          marker: string;
        }>;
        if (!params.length) return "";
        const lap = params[0].value[0];
        const rows = params
          .filter((p) => p.value[1] != null)
          .sort((a, b) => (a.value[1] as number) - (b.value[1] as number))
          .map((p) => {
            const t = p.value[1] as number;
            const delta = sessionBest != null ? t - sessionBest : 0;
            const deltaStr =
              delta < 0.0005
                ? '<span style="color:#22c55e">fastest</span>'
                : `<span style="color:#a1a1aa">+${delta.toFixed(3)}s</span>`;
            return `<div style="display:flex;gap:10px;align-items:center;margin-top:4px;font-size:12px">
              ${p.marker}
              <span style="flex:1">${p.seriesName}</span>
              <span style="font-family:monospace">${formatSeconds(t)}</span>
              <span style="font-family:monospace;min-width:68px;text-align:right">${deltaStr}</span>
            </div>`;
          })
          .join("");
        return `<div style="min-width:320px"><div style="font-weight:600;margin-bottom:2px">Lap ${lap}</div>${rows}</div>`;
      },
    },
    legend: {
      type: "scroll",
      bottom: 40,
      textStyle: { fontSize: 11 },
    },
    toolbox: {
      right: 20,
      top: 10,
      feature: {
        dataZoom: { yAxisIndex: "none", title: { zoom: "Zoom", back: "Reset" } },
        restore: { title: "Reset" },
        saveAsImage: { name: "lap-times", title: "Save PNG" },
      },
    },
    dataZoom: [
      { type: "inside", xAxisIndex: 0 },
      { type: "slider", xAxisIndex: 0, bottom: 6, height: 22 },
    ],
    grid: { left: 72, right: 40, top: 50, bottom: 100 },
    xAxis: {
      type: "value",
      name: "Lap",
      nameLocation: "middle",
      nameGap: 28,
      minInterval: 1,
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      name: "Lap time",
      nameLocation: "middle",
      nameGap: 52,
      scale: true,
      axisLabel: {
        formatter: (v: number) => formatSeconds(v),
      },
      splitLine: { lineStyle: { type: "dashed", opacity: 0.4 } },
    },
    series,
  };

  return <EChart option={option} style={{ height: 560 }} />;
}
