"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

// Format: { THEME_NAME: ["DEFAULT_COLOR", "DARK_COLOR"] }
const COLORS = {
  red: ["#ef4444", "#dc2626"],
  blue: ["#3b82f6", "#2563eb"],
  green: ["#22c55e", "#16a34a"],
  yellow: ["#eab308", "#d97706"],
  orange: ["#f97316", "#ea580c"],
  violet: ["#8b5cf6", "#7c3aed"],
} as const;

type ChartContextProps = {
  data: Record<string, any>[];
  categories: string[];
  index: string;
  colors?: (keyof typeof COLORS)[];
  yAxisDomain?: [number | "auto", number | "auto"];
};

const ChartContext = React.createContext<ChartContextProps>({
  data: [],
  categories: [],
  index: "",
  colors: ["blue"],
  yAxisDomain: ["auto", "auto"],
});

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <Chart />");
  }
  return context;
}

type ChartProps = React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer> &
  ChartContextProps & {
    className?: string;
  };

function Chart({ data, categories, index, colors, yAxisDomain, className, children, ...props }: ChartProps) {
  return (
    <ChartContext.Provider
      value={{
        data,
        categories,
        index,
        colors: colors || ["blue"],
        yAxisDomain: yAxisDomain || ["auto", "auto"],
      }}
    >
      <RechartsPrimitive.ResponsiveContainer width="100%" height={300} className={className} {...props}>
        <RechartsPrimitive.ComposedChart data={data}>{children}</RechartsPrimitive.ComposedChart>
      </RechartsPrimitive.ResponsiveContainer>
    </ChartContext.Provider>
  );
}

// User-defined type guard for Date
function isDate(value: any): value is Date {
  return typeof value === 'object' && value !== null && value instanceof Date;
}

type ChartTooltipProps = React.ComponentProps<typeof RechartsPrimitive.Tooltip> & {
  hideIndicator?: boolean;
  hideLabel?: boolean;
  formatter?: (value: number, name: string, props: any) => [string, string] | string;
  className?: string;
};

function ChartTooltip({
  cursor = false,
  content,
  hideIndicator = false,
  hideLabel = false,
  formatter,
  className,
  ...props
}: ChartTooltipProps) {
  const { categories, index, colors } = useChart();
  
  // Determine the cursor prop based on its type
  const tooltipCursor = typeof cursor === 'boolean'
    ? cursor
    : {
        strokeDasharray: Array.isArray(cursor) ? cursor.join(" ") : undefined,
        stroke: "hsl(var(--chart-foreground))",
        opacity: 0.15
      };

  return (
    <RechartsPrimitive.Tooltip
      cursor={tooltipCursor}
      content={({ active, payload, label }) => {
        // Extract label formatting logic into a useMemo hook
        const formattedLabel = React.useMemo(() => {
          if (isDate(label)) {
            return label.toLocaleDateString();
          }
          return String(label);
        }, [label]);

        if (active && payload && payload.length) {
          return (
            <div
              className={cn(
                "grid gap-1.5 rounded-lg border border-border/50 bg-card/80 px-3 py-2 text-xs shadow-xl backdrop-blur-lg",
                className,
              )}
            >
              {!hideLabel && (
                <div className="text-muted-foreground">
                  {formattedLabel}
                </div>
              )}
              {payload.map((item, i) => {
                const key = item.dataKey || item.name || "value";
                const color = COLORS[colors?.[i] || "blue"][0];
                return (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      {!hideIndicator && (
                        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                      )}
                      {item.name}
                    </div>
                    <div className="font-medium text-foreground">
                      {formatter ? formatter(item.value as number, item.name as string, item) : item.value}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }
        return null;
      }}
      {...props}
    />
  );
}

type ChartLegendProps = React.ComponentProps<typeof RechartsPrimitive.Legend> & {
  hideIcon?: boolean;
  nameKey?: string;
  // Removed 'payload' from here as it's handled by the content render prop
};

function ChartLegend({
  content,
  className,
  hideIcon = false,
  nameKey,
  // Removed payload from destructuring
  ...props
}: ChartLegendProps) {
  const { colors } = useChart();

  return (
    <RechartsPrimitive.Legend
      content={({ payload: legendPayload }) => { // Use legendPayload from render prop
        if (!legendPayload || !legendPayload.length) {
          return null;
        }
        return (
          <div className={cn("flex flex-wrap items-center justify-center gap-2", className)}>
            {legendPayload.map((item, i) => {
              const key = `${nameKey || item.dataKey || "value"}`;
              const color = COLORS[colors?.[i] || "blue"][0];
              return (
                <div key={key} className="flex items-center gap-2">
                  {!hideIcon && (
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                  )}
                  <div className="text-xs text-muted-foreground">{item.value}</div>
                </div>
              );
            })}
          </div>
        );
      }}
      {...props}
    />
  );
}

export { Chart, ChartTooltip, ChartLegend };