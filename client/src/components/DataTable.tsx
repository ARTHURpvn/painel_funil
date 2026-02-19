import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Loader2 } from "lucide-react";

interface FunnelRow {
  gestor: string | null;
  site: string | null;
  nicho: string | null;
  product: string | null;
  date: Date | string | null;
  dateStr?: string;
  totalCost: string;
  totalProfit: string;
  avgRoi: string;
}

interface DataTableProps {
  data: FunnelRow[];
  isLoading?: boolean;
}

function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (num === 0) return "";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(num);
}

function formatDate(date: Date | string | null): string {
  if (!date) return "";
  // Parse date string directly to avoid timezone issues
  if (typeof date === "string") {
    const [, month, day] = date.split('-');
    return `${day}/${month}`;
  }
  // For Date objects, use UTC methods to avoid timezone shifts
  return `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function calculateRoi(cost: string | number, profit: string | number): number {
  const costNum = typeof cost === "string" ? parseFloat(cost) : cost;
  const profitNum = typeof profit === "string" ? parseFloat(profit) : profit;
  if (costNum === 0) return 0;
  return (profitNum / costNum) * 100;
}

function getRoiClass(roi: number): string {
  if (roi < 0) return "roi-negative";
  if (roi <= 10) return "roi-neutral";
  return "roi-positive";
}


// Group data by funnel (gestor + site + nicho + product)
interface GroupedFunnel {
  key: string;
  gestor: string;
  site: string;
  nicho: string;
  product: string;
  totalCost: number;
  dailyData: {
    date: string;
    cost: number;
    profit: number;
    roi: number;
  }[];
}

export default function DataTable({ data, isLoading }: DataTableProps) {
  // Group and process data
  const { groupedData, allDates } = useMemo(() => {
    const groups = new Map<string, GroupedFunnel>();
    const datesSet = new Set<string>();

    for (const row of data) {
      const key = `${row.gestor || ""}-${row.site || ""}-${row.nicho || ""}-${row.product || ""}`;
      const dateStr = row.dateStr || (row.date
        ? typeof row.date === "string"
          ? row.date.split("T")[0]
          : row.date.toISOString().split("T")[0]
        : "");

      if (dateStr) datesSet.add(dateStr);

      const cost = parseFloat(row.totalCost) || 0;
      const profit = parseFloat(row.totalProfit) || 0;
      const roi = parseFloat(row.avgRoi) || calculateRoi(cost, profit);

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          gestor: row.gestor || "",
          site: row.site || "",
          nicho: row.nicho || "",
          product: row.product || "",
          totalCost: 0,
          dailyData: [],
        });
      }

      const group = groups.get(key)!;
      group.totalCost += cost;
      group.dailyData.push({
        date: dateStr,
        cost,
        profit,
        roi,
      });
    }

    // Sort groups by total cost descending
    const sortedGroups = Array.from(groups.values()).sort(
      (a, b) => b.totalCost - a.totalCost
    );

    // Sort dates
    const sortedDates = Array.from(datesSet).sort();

    return { groupedData: sortedGroups, allDates: sortedDates };
  }, [data]);

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (groupedData.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8 text-center text-muted-foreground">
          <Table className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum dado encontrado</p>
          <p className="text-sm mt-2">Faça upload de um arquivo CSV para começar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Table className="w-5 h-5" />
          Dados por Funil ({groupedData.length} funis)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-secondary">
                <th className="px-4 py-3 text-left text-sm font-semibold text-secondary-foreground border-b border-border">
                  Gestor
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-secondary-foreground border-b border-border">
                  Site
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-secondary-foreground border-b border-border">
                  Nicho
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-secondary-foreground border-b border-border">
                  Produto
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-secondary-foreground border-b border-border">
                  Resultado
                </th>
                {allDates.map((date) => (
                  <th
                    key={date}
                    className="px-4 py-3 text-center text-sm font-semibold text-secondary-foreground border-b border-border min-w-[100px]"
                  >
                    {formatDate(date)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupedData.map((funnel) => {
                // Create a map of date -> data for this funnel
                const dateMap = new Map(
                  funnel.dailyData.map((d) => [d.date, d])
                );

                return (
                  <React.Fragment key={funnel.key}>
                    {/* Row 1: Gasto */}
                    <tr className="border-b border-border/50">
                      <td className="px-4 py-2 text-sm text-foreground" rowSpan={3}>
                        {funnel.gestor || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm text-foreground" rowSpan={3}>
                        {funnel.site || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm text-foreground" rowSpan={3}>
                        {funnel.nicho || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm text-foreground" rowSpan={3}>
                        {funnel.product || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm text-muted-foreground">
                        Gasto
                      </td>
                      {allDates.map((date) => {
                        const dayData = dateMap.get(date);
                        return (
                          <td
                            key={date}
                            className="px-4 py-2 text-sm text-foreground text-center"
                          >
                            {dayData ? formatCurrency(dayData.cost) : ""}
                          </td>
                        );
                      })}
                    </tr>
                    {/* Row 2: Profit */}
                    <tr className="border-b border-border/50">
                      <td className="px-4 py-2 text-sm text-muted-foreground">
                        Profit
                      </td>
                      {allDates.map((date) => {
                        const dayData = dateMap.get(date);
                        return (
                          <td
                            key={date}
                            className="px-4 py-2 text-sm text-foreground text-center"
                          >
                            {dayData ? formatCurrency(dayData.profit) : ""}
                          </td>
                        );
                      })}
                    </tr>
                    {/* Row 3: ROI */}
                    <tr className="border-b border-border">
                      <td className="px-4 py-2 text-sm text-muted-foreground">
                        ROI
                      </td>
                      {allDates.map((date) => {
                        const dayData = dateMap.get(date);
                        if (!dayData || dayData.cost === 0) {
                          return (
                            <td key={date} className="px-4 py-2 text-sm text-center">
                              
                            </td>
                          );
                        }
                        return (
                          <td
                            key={date}
                            className={`px-4 py-2 text-sm text-center ${getRoiClass(dayData.roi)}`}
                          >
                            {dayData.roi.toFixed(2)}%
                          </td>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

