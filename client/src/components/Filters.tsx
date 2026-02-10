import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter, X } from "lucide-react";

interface FilterOptions {
  gestores: string[];
  redes: string[];
  nichos: string[];
  advs: string[];
  vsls: string[];
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

interface FiltersProps {
  options: FilterOptions;
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  onClear: () => void;
}

const REDE_LABELS: Record<string, string> = {
  MG: "MediaGo",
  NB: "Newsbreak",
  TB: "Taboola",
  RC: "Revcontent",
  OB: "Outbrain",
};

export default function Filters({ options, values, onChange, onClear }: FiltersProps) {
  const handleChange = (key: keyof FilterValues, value: string | undefined) => {
    onChange({ ...values, [key]: value === "all" ? undefined : value });
  };

  const hasActiveFilters = Object.values(values).some((v) => v !== undefined && v !== "");

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground">
              <X className="w-4 h-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          {/* Gestor */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Gestor</Label>
            <Select
              value={values.gestor || "all"}
              onValueChange={(v) => handleChange("gestor", v)}
            >
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">Todos</SelectItem>
                {options.gestores.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rede */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Rede</Label>
            <Select
              value={values.rede || "all"}
              onValueChange={(v) => handleChange("rede", v)}
            >
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">Todas</SelectItem>
                {options.redes.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r} ({REDE_LABELS[r] || r})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nicho */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Nicho</Label>
            <Select
              value={values.nicho || "all"}
              onValueChange={(v) => handleChange("nicho", v)}
            >
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">Todos</SelectItem>
                {options.nichos.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ADV */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">ADV</Label>
            <Select
              value={values.adv || "all"}
              onValueChange={(v) => handleChange("adv", v)}
            >
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border max-h-60">
                <SelectItem value="all">Todos</SelectItem>
                {options.advs.sort().map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* VSL */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">VSL</Label>
            <Select
              value={values.vsl || "all"}
              onValueChange={(v) => handleChange("vsl", v)}
            >
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border max-h-60">
                <SelectItem value="all">Todas</SelectItem>
                {options.vsls.sort().map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data Início */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Data Início</Label>
            <Input
              type="date"
              value={values.dataInicio || ""}
              onChange={(e) => handleChange("dataInicio", e.target.value || undefined)}
              className="bg-input border-border"
            />
          </div>

          {/* Data Fim */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Data Fim</Label>
            <Input
              type="date"
              value={values.dataFim || ""}
              onChange={(e) => handleChange("dataFim", e.target.value || undefined)}
              className="bg-input border-border"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
