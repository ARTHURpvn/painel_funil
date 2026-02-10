import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, ShoppingCart, Percent } from "lucide-react";

interface TotalsProps {
  totalCost: number;
  totalProfit: number;
  totalPurchases: number;
  roi: number;
  isLoading?: boolean;
}

function formatCurrency(value: number): string {
  if (value === 0) return "-";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

function getRoiColorClass(roi: number): string {
  if (roi < 0) return "text-red-500";
  if (roi <= 10) return "text-yellow-500";
  return "text-green-500";
}

export default function Totals({
  totalCost,
  totalProfit,
  totalPurchases,
  roi,
  isLoading,
}: TotalsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-card border-border animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-20 mb-2" />
              <div className="h-8 bg-muted rounded w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">Total Gasto</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(totalCost)}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Total Profit</span>
          </div>
          <p className={`text-2xl font-bold ${totalProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
            {formatCurrency(totalProfit)}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Percent className="w-4 h-4" />
            <span className="text-sm">ROI Geral</span>
          </div>
          <p className={`text-2xl font-bold ${getRoiColorClass(roi)}`}>
            {formatPercent(roi)}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <ShoppingCart className="w-4 h-4" />
            <span className="text-sm">Total Compras</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {totalPurchases || "-"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
