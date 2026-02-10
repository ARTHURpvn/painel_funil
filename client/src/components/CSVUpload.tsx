import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, FileText, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface CSVUploadProps {
  onUploadSuccess: () => void;
}

export default function CSVUpload({ onUploadSuccess }: CSVUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [csvContent, setCsvContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [duplicateDates, setDuplicateDates] = useState<string[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  const uploadMutation = trpc.funnel.upload.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        setCsvContent(null);
        setFileName(null);
        onUploadSuccess();
      } else if (data.duplicateDates && data.duplicateDates.length > 0) {
        setDuplicateDates(data.duplicateDates);
        setShowDuplicateDialog(true);
      } else {
        toast.error(data.message);
      }
      setIsUploading(false);
    },
    onError: (error) => {
      toast.error("Erro no upload: " + error.message);
      setIsUploading(false);
    },
  });

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Por favor, selecione um arquivo CSV");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);
      setFileName(file.name);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleUpload = useCallback(
    (replaceExisting: boolean = false) => {
      if (!csvContent) return;
      setIsUploading(true);
      setShowDuplicateDialog(false);
      uploadMutation.mutate({ csvContent, replaceExisting });
    },
    [csvContent, uploadMutation]
  );

  const handleIgnoreDuplicates = useCallback(() => {
    setShowDuplicateDialog(false);
    toast.info("Upload cancelado. Datas duplicadas foram ignoradas.");
    setCsvContent(null);
    setFileName(null);
  }, []);

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload de CSV
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {csvContent ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-primary">
                  <FileText className="w-8 h-8" />
                  <span className="font-medium">{fileName}</span>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => handleUpload(false)}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Importar
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCsvContent(null);
                      setFileName(null);
                    }}
                    disabled={isUploading}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">
                  Arraste um arquivo CSV ou clique para selecionar
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileInput}
                  className="hidden"
                  id="csv-input"
                />
                <label htmlFor="csv-input">
                  <Button variant="outline" asChild>
                    <span className="cursor-pointer">Selecionar arquivo</span>
                  </Button>
                </label>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Formato esperado: Campaign, Prelanding, Landing, Date, Cost, Profit, Total ROI, Purchase, InitiateCheckout CPA
          </p>
        </CardContent>
      </Card>

      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Datas Duplicadas Encontradas
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              As seguintes datas já existem no banco de dados:
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted rounded-lg p-4 max-h-40 overflow-y-auto">
            <ul className="space-y-1">
              {duplicateDates.map((date) => (
                <li key={date} className="text-sm text-foreground">
                  {new Date(date).toLocaleDateString("pt-BR")}
                </li>
              ))}
            </ul>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleIgnoreDuplicates}>
              Ignorar (Cancelar Upload)
            </Button>
            <Button onClick={() => handleUpload(true)} disabled={isUploading}>
              {isUploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Substituir Dados
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
