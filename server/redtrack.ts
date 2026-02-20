import axios, { AxiosInstance } from "axios";
import { z } from "zod";

// Helper function para adicionar delay entre requisições
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Schemas para validação dos dados da RedTrack API
const RedTrackCampaignSchema = z.object({
  campaign: z.string().optional().default(""),
  gestor: z.string().optional().default(""),
  site: z.string().optional().default(""),
  nicho: z.string().optional().default(""),
  product: z.string().optional().default(""),
  date: z.string().optional().default(""),
  cost: z.number().optional().default(0),
  profit: z.number().optional().default(0),
  roi: z.number().optional().default(0),
});

const RedTrackReportSchema = z.array(RedTrackCampaignSchema);
export type RedTrackReport = z.infer<typeof RedTrackReportSchema>;

/**
 * RedTrack API Service
 * Handles communication with RedTrack API
 */
export class RedTrackService {
  private client: AxiosInstance;
  private apiKey: string;

  constructor() {
    const apiUrl = process.env.REDTRACK_API_URL || "https://api.redtrack.io";
    const apiKey = process.env.REDTRACK_API_KEY;

    if (!apiKey) {
      throw new Error("REDTRACK_API_KEY environment variable is required");
    }

    this.apiKey = apiKey;

    this.client = axios.create({
      baseURL: apiUrl,
      headers: {
        accept: "application/json",
      },
      timeout: 30000,
    });
  }

  /**
   * Fetch campaign data from RedTrack API
   * @param startDate - Start date in YYYY-MM-DD format
   * @param endDate - End date in YYYY-MM-DD format
   */
  async getCampaignReport(
    startDate: string,
    endDate: string
  ): Promise<RedTrackReport> {
    try {
      let data: RedTrackReport = [];

      const startDateTime = new Date(startDate).getTime();
      const endDateTime = new Date(endDate).getTime();
      const diff = endDateTime - startDateTime;
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;

      for (let i = 0; i < days; i++) {
        if (i > 0) {
          await sleep(2500);
        }

        const currentDate = new Date(startDateTime + i * 24 * 60 * 60 * 1000);
        const dateStr = currentDate.toISOString().split("T")[0];

        const params: Record<string, string | boolean| number> = {
          api_key: this.apiKey,
          group: "campaign,sub1,sub2,sub3",
          date_from: dateStr,
          date_to: dateStr,
          total: true,
          rt_campaign: "NT",
          per: 1000
        };

        let response = await this.client.get("/report", {
          params: { ...params },
        });

        console.log(`[RedTrack] Fetched data for ${dateStr} (${i+1}/${days}): ${response.data?.items?.length || 0} records`);

        let responseData = response.data;
        if (responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
          responseData = responseData.items;
        }

        let parsed = RedTrackReportSchema.parse(responseData);

        const gestoresPermitidos = ["NTE-ERICK", "NTE-BARROS"];

        const totalRecords = parsed.length;
        parsed = parsed.filter(record => {
          const parts = record.campaign.split(" | ");
          const gestor = parts[1]?.trim().toUpperCase() || "";
          const hasValidCost = record.cost > 0;
          console.log(
            `[RedTrack] ${gestoresPermitidos.includes(gestor) && hasValidCost ? "Aprovado" : "Negado"} - ${gestor} - ${record.cost}`
          );
          return gestoresPermitidos.includes(gestor) && hasValidCost;
        });

        console.log(`[RedTrack] ${dateStr}: ${parsed.length}/${totalRecords} campanhas aprovadas`);

        // Estrutura: NT | Gestor | Plataforma | Nicho | Produto | ? | Site | Teste
        parsed.forEach((record, index) => {
          const parts = record.campaign.split(" | ");

          // Normalizar gestor para uppercase para evitar duplicatas
          parsed[index].gestor = parts[1] ? parts[1].trim().toUpperCase() : "";
          parsed[index].nicho = parts[3] ? parts[3].trim() : "";
          parsed[index].product = parts[4] ? parts[4].trim() : "";
          parsed[index].site = parts[6] ? parts[6].trim() : "";
          parsed[index].date = dateStr;
          parsed[index].cost = parseFloat(String(record.cost)) || 0;
          parsed[index].profit = parseFloat(String(record.profit)) || 0;
          parsed[index].roi = parseFloat(String(record.roi)) || 0;
        });

        data.push(...parsed);
      }

      console.log(`[RedTrack] Total de campanhas aprovadas: ${data.length}`);
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `RedTrack API Error: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      // Test with a simple report request for today
      const today = new Date().toISOString().split("T")[0];
      await this.client.get("/report", {
        params: {
          api_key: this.apiKey,
          group: "campaign",
          date_from: today,
          date_to: today,
          total: "false",
        },
      });
      console.log("[RedTrack] Connection test successful");
      return true;
    } catch (error) {
      console.error("[RedTrack] Connection test failed:", error);
      return false;
    }
  }
}

// Singleton instance
let redTrackService: RedTrackService | null = null;

export function getRedTrackService(): RedTrackService {
  if (!redTrackService) {
    redTrackService = new RedTrackService();
  }
  return redTrackService;
}
