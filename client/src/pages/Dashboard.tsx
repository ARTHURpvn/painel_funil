import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Upload } from "lucide-react";
import { trpc } from "@/lib/trpc";
import CSVUpload from "@/components/CSVUpload";
import Filters from "@/components/Filters";
import Totals from "@/components/Totals";
import DataTable from "@/components/DataTable";
import DailyChart from "@/components/DailyChart";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DashboardProps {
  onLogout: () => void;
}

interface FilterValues {
  gestor?: string;
  rede?: string;
  nicho?: string;
  adv?: string;
  vsl?: string;
  dataInicio?: string;
  dataFim?: string;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [filters, setFilters] = useState<FilterValues>({});
  const [showUpload, setShowUpload] = useState(false);

  // Fetch filter options
  const { data: filterOptions, refetch: refetchFilters } = trpc.funnel.getFilters.useQuery();

  // Fetch data with filters
  const { data: funnelData, isLoading: isLoadingData, refetch: refetchData } = trpc.funnel.getData.useQuery(filters);

  // Fetch totals with filters
  const { data: totals, isLoading: isLoadingTotals, refetch: refetchTotals } = trpc.funnel.getTotals.useQuery(filters);

  // Fetch daily totals for chart
  const { data: dailyTotals, refetch: refetchDailyTotals } = trpc.funnel.getDailyTotals.useQuery(filters);

  // Memoized filter options with defaults
  const options = useMemo(
    () => ({
      gestores: filterOptions?.gestores || [],
      redes: filterOptions?.redes || [],
      nichos: filterOptions?.nichos || [],
      advs: filterOptions?.advs || [],
      vsls: filterOptions?.vsls || [],
    }),
    [filterOptions]
  );

  const handleUploadSuccess = () => {
    setShowUpload(false);
    refetchFilters();
    refetchData();
    refetchTotals();
    refetchDailyTotals();
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleLogout = () => {
    localStorage.removeItem("painel_auth");
    onLogout();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-20">
        <div className="container py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Painel de Funis</h1>
          <div className="flex items-center gap-3">
            <Dialog open={showUpload} onOpenChange={setShowUpload}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload CSV
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Upload de Dados</DialogTitle>
                </DialogHeader>
                <CSVUpload onUploadSuccess={handleUploadSuccess} />
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6 space-y-6">
        {/* Totals */}
        <Totals
          totalCost={totals?.totalCost || 0}
          totalProfit={totals?.totalProfit || 0}
          totalPurchases={totals?.totalPurchases || 0}
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
