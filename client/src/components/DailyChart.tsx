import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { BarChart3 } from "lucide-react";

interface DailyData {
  date: string;
  cost: number;
  profit: number;
  roi: number;
}

interface DailyChartProps {
  data: DailyData[];
}

// Custom label component to show ROI inside bars
const CustomLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  if (height < 20) return null; // Don't show label if bar is too small
  
  const roi = value;
  const roiText = `${(roi * 100).toFixed(0)}%`;
  
  return (
    <text
      x={x + width / 2}
      y={y + height / 2}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={11}
      fontWeight="bold"
    >
      {roiText}
    </text>
  );
};

// Get bar color based on ROI
const getBarColor = (roi: number): string => {
  if (roi < 0) return "#ef4444"; // red
  if (roi <= 0.10) return "#eab308"; // yellow
  return "#22c55e"; // green
};

export default function DailyChart({ data }: DailyChartProps) {
  const chartData = useMemo(() => {
    // Sort by date and format for chart
    return [...data]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((item) => {
        // Parse date string directly to avoid timezone issues
        const [year, month, day] = item.date.split('-');
        const formattedDate = `${day}/${month}`;
        return {
          date: formattedDate,
          fullDate: item.date,
          cost: item.cost,
          profit: item.profit,
          roi: item.roi,
          roiPercent: (item.roi * 100).toFixed(1),
        };
      });
  }, [data]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          <p className="text-sm text-muted-foreground">
            Gasto: <span className="text-foreground font-medium">{formatCurrency(item.cost)}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Profit: <span className={`font-medium ${item.profit >= 0 ? "text-green-500" : "text-red-500"}`}>
              {formatCurrency(item.profit)}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            ROI: <span className={`font-medium ${
              item.roi < 0 ? "text-red-500" : item.roi <= 0.10 ? "text-yellow-500" : "text-green-500"
            }`}>
              {item.roiPercent}%
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Gasto por Dia
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey="date" 
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
                tickLine={{ stroke: "#a1a1aa" }}
                axisLine={{ stroke: "#3f3f46" }}
              />
              <YAxis 
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
                tickLine={{ stroke: "#a1a1aa" }}
                axisLine={{ stroke: "#3f3f46" }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.roi)} />
                ))}
                <LabelList 
                  dataKey="roi" 
                  content={<CustomLabel />}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span>ROI &lt; 0%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-500"></div>
            <span>ROI 0-10%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span>ROI &gt; 10%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
