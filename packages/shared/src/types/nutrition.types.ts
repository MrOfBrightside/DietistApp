export interface NutrientValue {
  code: string;
  name: string;
  value: number | null;
  unit: string;
}

export interface NutritionSummary {
  nutrients: NutrientValue[];
  totalGrams: number;
  calculatedAt: Date;
  isStale?: boolean;
  oldestDataDate?: Date;
}

export interface MealNutrition {
  mealType: string;
  entries: EntryNutrition[];
  summary: NutritionSummary;
}

export interface EntryNutrition {
  entryId: string;
  foodName: string;
  grams: number;
  nutrients: NutrientValue[];
}

export interface DayNutrition {
  date: string;
  meals: MealNutrition[];
  daySummary: NutritionSummary;
}

export interface RangeNutrition {
  from: string;
  to: string;
  days: DayNutrition[];
  rangeSummary: NutritionSummary;
}

// Common nutrient codes från Livsmedelsverket
export const NUTRIENT_CODES = {
  ENERGY: 'Ener',
  PROTEIN: 'Prot',
  CARBOHYDRATE: 'Kolh',
  FAT: 'Fett',
  FIBER: 'Fib',
  // Vitaminer
  VITAMIN_A: 'VitA',
  VITAMIN_D: 'VitD',
  VITAMIN_E: 'VitE',
  VITAMIN_K: 'VitK',
  VITAMIN_C: 'VitC',
  THIAMIN: 'Tia',
  RIBOFLAVIN: 'Ribo',
  NIACIN: 'Niek',
  VITAMIN_B6: 'VitB6',
  FOLATE: 'Folat',
  VITAMIN_B12: 'VitB12',
  // Mineraler
  CALCIUM: 'Ca',
  IRON: 'Fe',
  MAGNESIUM: 'Mg',
  PHOSPHORUS: 'P',
  POTASSIUM: 'K',
  SODIUM: 'Na',
  ZINC: 'Zn',
  SELENIUM: 'Se',
  IODINE: 'I',
} as const;
