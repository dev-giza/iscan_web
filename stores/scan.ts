import { defineStore } from "pinia";

interface ScanResult {
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  weight?: string;
  price?: number;
  image?: string;
}

interface ScanState {
  currentScan: ScanResult | null;
  scanHistory: ScanResult[];
  isLoading: boolean;
  error: string | null;
}

type ScanStoreActions = {
  setCurrentScan(scan: ScanResult | null): void;
  clearCurrentScan(): void;
  fetchProductData(barcode: string): Promise<void>;
};

type ScanStoreGetters = {
  hasCurrentScan(): boolean;
  hasScanHistory(): boolean;
};

export const useScanStore = defineStore<
  "scan",
  ScanState,
  ScanStoreGetters,
  ScanStoreActions
>("scan", {
  state: (): ScanState => ({
    currentScan: null,
    scanHistory: [],
    isLoading: false,
    error: null,
  }),

  getters: {
    hasCurrentScan(): boolean {
      return this.currentScan !== null;
    },
    hasScanHistory(): boolean {
      return this.scanHistory.length > 0;
    },
  },

  actions: {
    setCurrentScan(scan: ScanResult | null) {
      this.currentScan = scan;
      if (scan) {
        const exists = this.scanHistory.some(
          (item) => item.barcode === scan.barcode
        );
        if (!exists) {
          this.scanHistory.unshift(scan);
        }
      }
    },

    clearCurrentScan() {
      this.currentScan = null;
    },

    async fetchProductData(barcode: string) {
      this.isLoading = true;
      this.error = null;

      try {
        // Здесь будет реальный API запрос
        const response = await fetch(`/api/products/${barcode}`);
        if (!response.ok) {
          throw new Error("Не удалось получить данные о продукте");
        }

        const data = await response.json();
        this.setCurrentScan(data);
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "Произошла ошибка";
        console.error("Error fetching product data:", error);
      } finally {
        this.isLoading = false;
      }
    },
  },
});
