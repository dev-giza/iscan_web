import { defineStore } from "pinia";

interface Nutrition {
  proteins: number;
  fats: number;
  carbohydrates: number;
  calories: number;
  kcal: number;
}

interface HarmfulComponent {
  name: string;
  effect: string;
  recommendation: string;
}

interface ExtraInfo {
  ingredients?: string;
  explanation_score?: string;
  harmful_components?: HarmfulComponent[];
  recommendedfor?: string;
  frequency?: string;
  alternatives?: string;
}

interface ScanResult {
  product_name: string;
  barcode: string;
  manufacturer: string | null;
  allergens?: string;
  score: number | null;
  nutrition: Nutrition | null;
  extra?: ExtraInfo;
  image_front?: string;
  image_ingredients?: string;
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
  loadHistoryFromStorage(): void;
};

type ScanStoreGetters = {
  hasCurrentScan(): boolean;
  hasScanHistory(): boolean;
};

// Загрузка истории из localStorage
const loadHistory = (): ScanResult[] => {
  try {
    const savedHistory = localStorage.getItem("scanHistory");
    return savedHistory ? JSON.parse(savedHistory) : [];
  } catch (error) {
    console.error("Error loading history from localStorage:", error);
    return [];
  }
};

// Сохранение истории в localStorage
const saveHistory = (history: ScanResult[]) => {
  try {
    localStorage.setItem("scanHistory", JSON.stringify(history));
  } catch (error) {
    console.error("Error saving history to localStorage:", error);
  }
};

export const useScanStore = defineStore<
  "scan",
  ScanState,
  ScanStoreGetters,
  ScanStoreActions
>("scan", {
  state: (): ScanState => ({
    currentScan: null,
    scanHistory: loadHistory(), // Загружаем историю при инициализации store
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
      if (scan) {
        this.currentScan = {
          product_name: scan.product_name || "",
          barcode: scan.barcode,
          manufacturer: scan.manufacturer,
          allergens: scan.allergens,
          score: typeof scan.score === "number" ? scan.score : null,
          nutrition: scan.nutrition,
          extra: scan.extra,
          image_front: scan.image_front,
          image_ingredients: scan.image_ingredients,
        };

        const exists = this.scanHistory.some(
          (item) => item.barcode === scan.barcode
        );
        if (!exists) {
          this.scanHistory.unshift(this.currentScan);
          saveHistory(this.scanHistory); // Сохраняем историю при добавлении нового скана
        }
      } else {
        this.currentScan = null;
      }
    },

    clearCurrentScan() {
      this.currentScan = null;
    },

    loadHistoryFromStorage() {
      this.scanHistory = loadHistory();
    },

    async fetchProductData(barcode: string) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await fetch(`/api/find/${barcode}`);
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
