import axios, { AxiosInstance } from "axios";
import { z } from "zod";

// Schemas para validação dos dados da RedTrack API
const RedTrackCampaignSchema = z.object({
  campaign: z.string().optional().default(""),
  gestor: z.string().optional().default(""),
  vsl: z.string().optional().default(""),
  nicho: z.string().optional().default(""),
  product: z.string().optional().default(""),
  cost: z.number().or(z.string()).optional().default(0),
  profit: z.number().or(z.string()).optional().default(0),
  roi: z.number().or(z.string()).optional().default(0),
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
   * @param groupBy - Group data by specific dimensions (campaign, sub1, sub2, sub3, etc.)
   */
  async getCampaignReport(
    startDate: string,
    endDate: string,
    groupBy: string[] = ["campaign", "sub1", "sub2", "sub3"]
  ): Promise<RedTrackReport> {
    try {
      console.log(`[RedTrack] Fetching report from ${startDate} to ${endDate}`);
      let res: string[] = [];

      const params: Record<string, string> = {
        api_key: this.apiKey,
        group: groupBy.join(","),
        date_from: startDate,
        date_to: endDate,
        total: "false",
        rt_campaign: "NT",
      };

      const response = await this.client.get("/report", { params });
      let parsed = RedTrackReportSchema.parse(response.data);

      // normalizar maiusculo e minusculo
      const permitidos = ["NTE-NAYARA", "NTE-ERICK", "NTE-BARROS"];

      parsed = parsed.filter(record => {
        const nomeCampanha = record.campaign.toUpperCase();
        return permitidos.some(termo => nomeCampanha.includes(termo));
      });

      parsed.forEach((record, index) => {
        res = record.campaign.split(" | ");
        parsed[index].gestor = res[1] || "";
        parsed[index].product = res[4] || "";
      });
      console.log(parsed);

      console.log(
        `[RedTrack] Successfully fetched ${parsed?.length || 0} records`
      );

      return parsed;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("[RedTrack] API Error:", {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        throw new Error(
          `RedTrack API Error: ${error.response?.data?.message || error.message}`
        );
      }
      console.error("[RedTrack] Unexpected error:", error);
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
