import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NutritionSummary,
  DayNutrition,
  MealNutrition,
  EntryNutrition,
  MealType,
  calculateNutrientIntake,
  sumNutrients,
} from '@dietistapp/shared';
import { FoodEntryEntity, RecipeEntity, RecipeItemEntity } from '../database/entities';
import { LivsmedelverketService } from '../foods/livsmedelsverket.service';

@Injectable()
export class NutritionCalculationService {
  private readonly logger = new Logger(NutritionCalculationService.name);

  constructor(
    @InjectRepository(FoodEntryEntity)
    private entryRepository: Repository<FoodEntryEntity>,
    @InjectRepository(RecipeEntity)
    private recipeRepository: Repository<RecipeEntity>,
    private livsmedelverketService: LivsmedelverketService,
  ) {}

  /**
   * Beräkna näringsinnehåll för en dag
   */
  async calculateDayNutrition(
    clientId: string,
    date: string,
  ): Promise<DayNutrition> {
    this.logger.log(`Beräknar näringsinnehåll för klient ${clientId}, datum ${date}`);

    // Hämta alla entries för dagen
    const entries = await this.entryRepository.find({
      where: { clientId, date },
      order: { time: 'ASC' },
    });

    // Gruppera per måltid
    const mealGroups = this.groupByMeal(entries);

    // Beräkna per måltid
    const meals: MealNutrition[] = [];
    for (const [mealType, mealEntries] of Object.entries(mealGroups)) {
      const meal = await this.calculateMealNutrition(
        mealType as MealType,
        mealEntries,
      );
      meals.push(meal);
    }

    // Summera hela dagen
    const allNutrients = meals.map((m) => m.summary.nutrients);
    const daySummary: NutritionSummary = {
      nutrients: sumNutrients(allNutrients),
      totalGrams: meals.reduce((sum, m) => sum + m.summary.totalGrams, 0),
      calculatedAt: new Date(),
    };

    return {
      date,
      meals,
      daySummary,
    };
  }

  /**
   * Beräkna näringsinnehåll för en måltid
   */
  private async calculateMealNutrition(
    mealType: MealType,
    entries: FoodEntryEntity[],
  ): Promise<MealNutrition> {
    const entryNutritions: EntryNutrition[] = [];

    for (const entry of entries) {
      const entryNutrition = await this.calculateEntryNutrition(entry);
      entryNutritions.push(entryNutrition);
    }

    const allNutrients = entryNutritions.map((e) => e.nutrients);
    const summary: NutritionSummary = {
      nutrients: sumNutrients(allNutrients),
      totalGrams: entryNutritions.reduce((sum, e) => sum + e.grams, 0),
      calculatedAt: new Date(),
    };

    return {
      mealType,
      entries: entryNutritions,
      summary,
    };
  }

  /**
   * Beräkna näringsinnehåll för en entry (food eller recipe)
   */
  private async calculateEntryNutrition(
    entry: FoodEntryEntity,
  ): Promise<EntryNutrition> {
    if (entry.entryType === 'FOOD' && entry.foodNumber) {
      // Direkt livsmedel
      const nutrientData = await this.livsmedelverketService.getNutrientsByFoodNumber(
        entry.foodNumber,
      );

      const nutrients = calculateNutrientIntake(
        entry.grams,
        nutrientData.naeringsvaerden,
      );

      return {
        entryId: entry.id,
        foodName: entry.foodNameSnapshot,
        grams: entry.grams,
        nutrients,
      };
    } else if (entry.entryType === 'RECIPE' && entry.recipeId) {
      // Recept - expandera till ingredienser
      const recipe = await this.recipeRepository.findOne({
        where: { id: entry.recipeId },
        relations: ['items'],
      });

      if (!recipe) {
        throw new Error(`Recept ${entry.recipeId} finns inte`);
      }

      // Beräkna total näring för hela receptet
      const itemNutrients = [];
      for (const item of recipe.items) {
        const nutrientData = await this.livsmedelverketService.getNutrientsByFoodNumber(
          item.foodNumber,
        );
        const nutrients = calculateNutrientIntake(
          item.grams,
          nutrientData.naeringsvaerden,
        );
        itemNutrients.push(nutrients);
      }

      const totalRecipeNutrients = sumNutrients(itemNutrients);

      // Skala till användarens portion (entry.grams = antal portioner * gram per portion)
      // Förenkla: anta entry.grams = antal portioner
      const portionMultiplier = entry.grams / recipe.servings;

      const scaledNutrients = totalRecipeNutrients.map((n) => ({
        ...n,
        value: n.value !== null ? n.value * portionMultiplier : null,
      }));

      return {
        entryId: entry.id,
        foodName: entry.foodNameSnapshot,
        grams: entry.grams,
        nutrients: scaledNutrients,
      };
    }

    throw new Error('Invalid entry type');
  }

  /**
   * Gruppera entries per måltidstyp
   */
  private groupByMeal(
    entries: FoodEntryEntity[],
  ): Record<MealType, FoodEntryEntity[]> {
    const groups: Record<MealType, FoodEntryEntity[]> = {
      [MealType.BREAKFAST]: [],
      [MealType.LUNCH]: [],
      [MealType.DINNER]: [],
      [MealType.SNACK]: [],
    };

    for (const entry of entries) {
      groups[entry.mealType].push(entry);
    }

    return groups;
  }

  /**
   * Beräkna näringsinnehåll för ett datumintervall
   */
  async calculateRangeNutrition(
    clientId: string,
    fromDate: string,
    toDate: string,
  ) {
    const days: DayNutrition[] = [];

    // Generera alla datum i intervallet
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const current = new Date(start);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const dayNutrition = await this.calculateDayNutrition(clientId, dateStr);
      days.push(dayNutrition);
      current.setDate(current.getDate() + 1);
    }

    // Summera hela perioden
    const allDayNutrients = days.map((d) => d.daySummary.nutrients);
    const rangeSummary: NutritionSummary = {
      nutrients: sumNutrients(allDayNutrients),
      totalGrams: days.reduce((sum, d) => sum + d.daySummary.totalGrams, 0),
      calculatedAt: new Date(),
    };

    return {
      from: fromDate,
      to: toDate,
      days,
      rangeSummary,
    };
  }
}
