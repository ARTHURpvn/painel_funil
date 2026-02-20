import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { trpc } from "@/lib/trpc";
import Filters from "@/components/Filters";
import Totals from "@/components/Totals";
import DataTable from "@/components/DataTable";
import DailyChart from "@/components/DailyChart";
import { RedTrackImporter } from "@/components/RedTrackImporter";

interface FilterValues {
  gestor?: string;
  site?: string;
  nicho?: string;
  product?: string;
  dataInicio?: string;
  dataFim?: string;
}

export default function Dashboard() {
  const [filters, setFilters] = useState<FilterValues>({});

  // Fetch filter options
  const { data: filterOptions } = trpc.funnel.getFilters.useQuery();

  // Fetch data with filters
  const { data: funnelData, isLoading: isLoadingData } = trpc.funnel.getData.useQuery(filters);

  // Fetch totals with filters
  const { data: totals, isLoading: isLoadingTotals } = trpc.funnel.getTotals.useQuery(filters);

  // Fetch daily totals for chart
  const { data: dailyTotals } = trpc.funnel.getDailyTotals.useQuery(filters);

  // Memoized filter options with defaults
  const options = useMemo(
    () => ({
      gestores: filterOptions?.gestores || [],
      sites: filterOptions?.sites || [],
      nichos: filterOptions?.nichos || [],
      products: filterOptions?.products || [],
    }),
    [filterOptions]
  );


  const handleClearFilters = () => {
    setFilters({});
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-20">
        <div className="container py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Painel de Funis</h1>
          <div className="flex items-center gap-3">
            <RedTrackImporter />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6 space-y-6">
        {/* Totals */}
        <Totals
          totalCost={totals?.totalCost || 0}
          totalProfit={totals?.totalProfit || 0}
          roi={totals?.roi || 0}
          isLoading={isLoadingTotals}
        />

        {/* Daily Chart */}
        {dailyTotals && dailyTotals.length > 0 && (
          <DailyChart data={dailyTotals} />
        )}

        {/* Filters */}
        <Filters
          options={options}
          values={filters}
          onChange={setFilters}
          onClear={handleClearFilters}
        />

        {/* Data Table */}
        <DataTable data={funnelData || []} isLoading={isLoadingData} />
      </main>
    </div>
  );
}
