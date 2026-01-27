export interface LivsmedelFoodItem {
  nummer: string;
  namn: string;
  latin?: string;
  anmaerkningar?: string;
}

export interface LivsmedelNutrient {
  naeringsaemne: string;
  kod: string;
  vaerde: number | null;
  enhet: string;
  kaella?: string;
}

export interface LivsmedelNutrientData {
  nummer: string;
  namn: string;
  naeringsvaerden: LivsmedelNutrient[];
}

export interface LivsmedelSearchResult {
  items: LivsmedelFoodItem[];
  total: number;
}
