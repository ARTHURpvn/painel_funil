"use client"; 

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"; 
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
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const testConnection = trpc.funnel.testRedTrackConnection.useQuery(
    undefined,
    { enabled: false }
  );

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


  const handleImport = () => {
    if (!startDate || !endDate) {
      setResult({
        type: "error",
        message: "Por favor, selecione as datas de início e fim",
      });
      return;
    }
    setResult(null);
    importData.mutate({ startDate, endDate, replaceExisting });
  };

  const isLoading = testConnection.isFetching || importData.isPending;

  return (
    /* Botão que abre o Modal */
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost">
          <Download className="mr-2 h-4 w-4" />
          Importar Dados RedTrack
        </Button>
      </DialogTrigger>

      {/* Conteúdo do Modal */}
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Dados</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
                onCheckedChange={checked => setReplaceExisting(checked === true)}
                disabled={isLoading}
              />
              <Label htmlFor="replaceExisting" className="text-sm font-normal cursor-pointer">
                Substituir dados existentes no período selecionado
              </Label>
            </div>
          </div>

          {/* Result Alert */}
          {result && (
            <Alert variant={result.type === "error" ? "destructive" : "default"}>
              {result.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
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
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importando...</>
            ) : (
              <><Download className="mr-2 h-4 w-4" /> Importar Dados</>
            )}
          </Button>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2 text-sm">Informações</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Os dados serão importados dia a dia no intervalo selecionado</li>
              <li>• Um delay de 1 segundo é aplicado entre cada requisição</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}