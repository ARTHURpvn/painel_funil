import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Download, AlertCircle, CheckCircle } from "lucide-react";

/**
 * Component for importing data from RedTrack API
 *
 * Features:
 * - Date range selection
 * - Test API connection
 * - Import data with progress feedback
 * - Option to replace existing data
 */
export function RedTrackImporter() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("");
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Test connection mutation
  const testConnection = trpc.funnel.testRedTrackConnection.useQuery(
    undefined,
    {
      enabled: false,
    }
  );

  // Import mutation
  const importData = trpc.funnel.importFromRedTrack.useMutation({
    onSuccess: data => {
      setResult({
        type: data.success ? "success" : "error",
        message: data.message,
      });
    },
    onError: error => {
      setResult({
        type: "error",
        message: error.message,
      });
    },
  });

  const handleTestConnection = async () => {
    setResult(null);
    const data = await testConnection.refetch();

    if (data.data) {
      setResult({
        type: data.data.success ? "success" : "error",
        message: data.data.message,
      });
    }
  };

  const handleImport = () => {
    if (!startDate || !endDate) {
      setResult({
        type: "error",
        message: "Por favor, selecione as datas de início e fim",
      });
      return;
    }

    setResult(null);
    importData.mutate({
      startDate,
      endDate,
      replaceExisting,
      campaignFilter: campaignFilter || undefined,
    });
  };

  const isLoading = testConnection.isFetching || importData.isPending;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Importar Dados do RedTrack</CardTitle>
          <CardDescription>
            Importe dados de campanhas da API RedTrack para o banco de dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Connection */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Testar Conexão</h3>
              <p className="text-sm text-muted-foreground">
                Verifique se as credenciais da API estão corretas
              </p>
            </div>
            <Button
              onClick={handleTestConnection}
              disabled={isLoading}
              variant="outline"
            >
              {testConnection.isFetching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                "Testar"
              )}
            </Button>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data Fim</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="replaceExisting"
                checked={replaceExisting}
                onCheckedChange={checked =>
                  setReplaceExisting(checked === true)
                }
                disabled={isLoading}
              />
              <Label
                htmlFor="replaceExisting"
                className="text-sm font-normal cursor-pointer"
              >
                Substituir dados existentes no período selecionado
              </Label>
            </div>
          </div>

          {/* Result Alert */}
          {result && (
            <Alert
              variant={result.type === "error" ? "destructive" : "default"}
            >
              {result.type === "success" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}

          {/* Import Button */}
          <Button
            onClick={handleImport}
            disabled={isLoading || !startDate || !endDate}
            className="w-full"
            size="lg"
          >
            {importData.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Importar Dados
              </>
            )}
          </Button>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Formato de Nome de Campanha</h4>
            <p className="text-sm text-muted-foreground mb-2">
              As campanhas devem seguir este formato:
            </p>
            <code className="text-xs bg-background px-2 py-1 rounded">
              GESTOR_REDE_NICHO_ADV_VSL_PRODUTO
            </code>
            <p className="text-xs text-muted-foreground mt-2 break-all">
              Exemplo: ARTHUR_FB_EMAGRECIMENTO_ADV01_VSL01_PRODUTOX
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
