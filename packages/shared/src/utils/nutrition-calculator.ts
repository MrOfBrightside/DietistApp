import { NutrientValue } from '../types/nutrition.types';
import { LivsmedelNutrient } from '../types/livsmedelsverket.types';

/**
 * Beräknar näringsintag baserat på gram och näringsvärden per 100g
 * @param grams - Faktiska gram konsumerat
 * @param nutrientsPer100g - Näringsvärden per 100g från Livsmedelsverket
 * @returns Beräknade näringsvärden för angiven mängd
 */
export function calculateNutrientIntake(
  grams: number,
  nutrientsPer100g: LivsmedelNutrient[]
): NutrientValue[] {
  return nutrientsPer100g.map((nutrient) => ({
    code: nutrient.kod,
    name: nutrient.naeringsaemne,
    value: nutrient.vaerde !== null ? (grams / 100) * nutrient.vaerde : null,
    unit: nutrient.enhet,
  }));
}

/**
 * Summerar näringsvärden från flera poster
 * @param nutrientArrays - Array av näringsvärden att summera
 * @returns Summerade näringsvärden
 */
export function sumNutrients(nutrientArrays: NutrientValue[][]): NutrientValue[] {
  const nutrientMap = new Map<string, NutrientValue>();

  for (const nutrients of nutrientArrays) {
    for (const nutrient of nutrients) {
      const existing = nutrientMap.get(nutrient.code);
      if (existing) {
        // Summera värden, hantera null
        if (existing.value !== null && nutrient.value !== null) {
          existing.value += nutrient.value;
        } else if (nutrient.value !== null && existing.value === null) {
          existing.value = nutrient.value;
        }
      } else {
        // Lägg till nytt näringsämne
        nutrientMap.set(nutrient.code, { ...nutrient });
      }
    }
  }

  return Array.from(nutrientMap.values());
}

/**
 * Avrunda näringsvärden till lämpligt antal decimaler
 * @param value - Värdet att avrunda
 * @param decimals - Antal decimaler (standard 1)
 * @returns Avrundat värde eller null
 */
export function roundNutrientValue(value: number | null, decimals: number = 1): number | null {
  if (value === null) return null;
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Formatera näringsvärde med enhet
 * @param value - Näringsvärdet
 * @param unit - Enheten
 * @returns Formaterad sträng
 */
export function formatNutrientValue(value: number | null, unit: string): string {
  if (value === null) return 'N/A';
  const rounded = roundNutrientValue(value, 1);
  return `${rounded} ${unit}`;
}
