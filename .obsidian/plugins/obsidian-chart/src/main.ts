import { Plugin, MarkdownRenderChild } from "obsidian";
import {
  Chart,
  registerables
} from "chart.js/auto";

// Register all Chart.js components
Chart.register(...registerables);

interface SeriesConfig {
  key: string;
  label?: string;
  color?: string;
  borderColor?: string;
  backgroundColor?: string;
  fill?: boolean;
  borderWidth?: number;
  tension?: number;
  [key: string]: any;
}

const DEFAULT_PALETTE = [
  "#7C3AED", // Purple
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#8B5CF6", // Violet
  "#F97316"  // Orange
];

class ChartRenderChild extends MarkdownRenderChild {
  private chartInstance: Chart | null = null;

  constructor(containerEl: HTMLElement) {
    super(containerEl);
  }

  setChart(chart: Chart) {
    this.chartInstance = chart;
  }

  onunload() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
    super.onunload();
  }
}

export default class ChartPlugin extends Plugin {
  async onload() {
    console.log("Loading Chart.js Renderer plugin...");

    this.registerMarkdownCodeBlockProcessor("chart", (source, el, ctx) => {
      this.renderChart(source, el, ctx);
    });
  }

  private renderChart(source: string, el: HTMLElement, ctx: any) {
    el.empty();
    const renderChild = new ChartRenderChild(el);
    if (ctx && typeof ctx.addChild === "function") {
      ctx.addChild(renderChild);
    }

    const wrapper = el.createDiv({ cls: "obsidian-chart-wrapper" });

    let rawConfig: any;
    try {
      rawConfig = JSON.parse(source.trim());
    } catch (err: any) {
      const errorDiv = wrapper.createDiv({ cls: "obsidian-chart-error" });
      errorDiv.createEl("strong", { text: "Chart.js Plugin Error: " });
      errorDiv.createEl("span", { text: `Failed to parse JSON configuration (${err.message}).` });
      const pre = errorDiv.createEl("pre");
      pre.createEl("code", { text: source });
      return;
    }

    const isDarkMode = document.body.classList.contains("theme-dark");
    const textColor = isDarkMode ? "#E5E7EB" : "#374151";
    const gridColor = isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)";

    const chartConfig = this.buildChartConfig(rawConfig, textColor, gridColor);

    const canvasContainer = wrapper.createDiv({ cls: "obsidian-chart-container" });
    const canvas = canvasContainer.createEl("canvas");

    try {
      const chartInstance = new Chart(canvas, chartConfig);
      renderChild.setChart(chartInstance);
    } catch (chartErr: any) {
      wrapper.empty();
      const errorDiv = wrapper.createDiv({ cls: "obsidian-chart-error" });
      errorDiv.createEl("strong", { text: "Chart.js Render Error: " });
      errorDiv.createEl("span", { text: chartErr?.message || String(chartErr) });
    }
  }

  private buildChartConfig(raw: any, textColor: string, gridColor: string): any {
    // Standard Chart.js configuration detection (data.labels / data.datasets)
    if (raw.data && typeof raw.data === "object" && !Array.isArray(raw.data) && (raw.data.labels || raw.data.datasets)) {
      return this.mergeThemeDefaults(raw, textColor, gridColor);
    }

    // Custom simplified configuration
    const chartType = raw.type || "line";
    const dataArray = Array.isArray(raw.data) ? raw.data : [];
    const xKey = raw.xKey || "x";

    // Extract labels for X axis
    const labels = dataArray.map((item: any, idx: number) => {
      if (typeof item === "object" && item !== null) {
        return item[xKey] !== undefined ? String(item[xKey]) : `Point ${idx + 1}`;
      }
      return String(item);
    });

    let datasets: any[] = [];

    if (Array.isArray(raw.series) && raw.series.length > 0) {
      datasets = raw.series.map((s: SeriesConfig, i: number) => {
        const color = s.color || s.borderColor || DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];
        const seriesData = dataArray.map((item: any) =>
          typeof item === "object" && item !== null ? item[s.key] : null
        );

        const isFilled = ["bar", "pie", "doughnut", "polarArea", "radar"].includes(chartType) || s.fill;

        return {
          label: s.label || s.key,
          data: seriesData,
          borderColor: color,
          backgroundColor: s.backgroundColor || (isFilled ? this.hexToRgba(color, 0.2) : color),
          borderWidth: s.borderWidth ?? 2,
          tension: s.tension ?? (chartType === "line" ? 0.35 : 0),
          fill: s.fill ?? false,
          pointBackgroundColor: color,
          pointBorderColor: "#ffffff",
          pointHoverRadius: 6,
          pointRadius: 4,
          ...s
        };
      });
    } else if (dataArray.length > 0) {
      // Auto-discover series keys from the first data object if no series specified
      const sample = dataArray[0];
      if (typeof sample === "object" && sample !== null) {
        const keys = Object.keys(sample).filter((k) => k !== xKey);
        datasets = keys.map((key, i) => {
          const color = DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];
          return {
            label: key,
            data: dataArray.map((item) => item[key]),
            borderColor: color,
            backgroundColor: chartType === "line" ? color : this.hexToRgba(color, 0.2),
            borderWidth: 2,
            tension: chartType === "line" ? 0.35 : 0,
            pointBackgroundColor: color,
            pointBorderColor: "#ffffff"
          };
        });
      }
    }

    const titleText = raw.title || "";

    const baseConfig: any = {
      type: chartType,
      data: {
        labels,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: !!titleText,
            text: titleText,
            color: textColor,
            font: {
              size: 15,
              weight: "600",
              family: "var(--font-text, sans-serif)"
            },
            padding: { top: 6, bottom: 16 }
          },
          legend: {
            display: datasets.length > 0,
            labels: {
              color: textColor,
              font: {
                family: "var(--font-text, sans-serif)",
                size: 12
              },
              usePointStyle: true,
              boxWidth: 8,
              padding: 15
            }
          },
          tooltip: {
            mode: "index",
            intersect: false,
            backgroundColor: "rgba(17, 24, 39, 0.92)",
            titleColor: "#F9FAFB",
            bodyColor: "#F3F4F6",
            borderColor: "rgba(255, 255, 255, 0.15)",
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8
          }
        },
        scales: ["pie", "doughnut", "polarArea", "radar"].includes(chartType)
          ? undefined
          : {
              x: {
                grid: {
                  color: gridColor,
                  drawBorder: false
                },
                ticks: {
                  color: textColor,
                  font: {
                    family: "var(--font-text, sans-serif)",
                    size: 11
                  }
                }
              },
              y: {
                grid: {
                  color: gridColor,
                  drawBorder: false
                },
                ticks: {
                  color: textColor,
                  font: {
                    family: "var(--font-text, sans-serif)",
                    size: 11
                  }
                },
                beginAtZero: true
              }
            }
      }
    };

    if (raw.options) {
      baseConfig.options = this.deepMerge(baseConfig.options, raw.options);
    }

    return baseConfig;
  }

  private mergeThemeDefaults(raw: any, textColor: string, gridColor: string): any {
    const config = { ...raw };
    config.options = config.options || {};
    config.options.plugins = config.options.plugins || {};

    if (!config.options.plugins.legend) {
      config.options.plugins.legend = { labels: { color: textColor } };
    } else {
      config.options.plugins.legend.labels = { color: textColor, ...config.options.plugins.legend.labels };
    }

    return config;
  }

  private hexToRgba(hex: string, alpha: number): string {
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
      let c = hex.substring(1).split("");
      if (c.length === 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      const num = parseInt(c.join(""), 16);
      return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
    }
    return hex;
  }

  private deepMerge(target: any, source: any): any {
    const output = { ...target };
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (this.isObject(source[key])) {
          if (!(key in target)) Object.assign(output, { [key]: source[key] });
          else output[key] = this.deepMerge(target[key], source[key]);
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  private isObject(item: any): boolean {
    return item && typeof item === "object" && !Array.isArray(item);
  }
}
