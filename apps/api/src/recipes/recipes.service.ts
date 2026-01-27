import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRecipeDto, UpdateRecipeDto } from '@dietistapp/shared';
import { RecipeEntity, RecipeItemEntity } from '../database/entities';

@Injectable()
export class RecipesService {
  constructor(
    @InjectRepository(RecipeEntity)
    private recipeRepository: Repository<RecipeEntity>,
    @InjectRepository(RecipeItemEntity)
    private recipeItemRepository: Repository<RecipeItemEntity>,
  ) {}

  async createRecipe(userId: string, dto: CreateRecipeDto) {
    const recipe = this.recipeRepository.create({
      ownerId: userId,
      name: dto.name,
      servings: dto.servings,
      description: dto.description || null,
    });

    const savedRecipe = await this.recipeRepository.save(recipe);

    // Skapa items
    const items = dto.items.map((item) =>
      this.recipeItemRepository.create({
        recipeId: savedRecipe.id,
        foodNumber: item.foodNumber,
        foodNameSnapshot: item.foodNameSnapshot,
        grams: item.grams,
      }),
    );

    await this.recipeItemRepository.save(items);

    // Hämta komplett recept med items
    return this.recipeRepository.findOne({
      where: { id: savedRecipe.id },
      relations: ['items'],
    });
  }

  async getRecipes(userId: string) {
    return this.recipeRepository.find({
      where: { ownerId: userId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async getRecipeById(userId: string, recipeId: string) {
    const recipe = await this.recipeRepository.findOne({
      where: { id: recipeId },
      relations: ['items'],
    });

    if (!recipe) {
      throw new NotFoundException('Receptet finns inte');
    }

    if (recipe.ownerId !== userId) {
      throw new ForbiddenException('Du har inte tillgång till detta recept');
    }

    return recipe;
  }

  async updateRecipe(userId: string, recipeId: string, dto: UpdateRecipeDto) {
    const recipe = await this.getRecipeById(userId, recipeId);

    // Uppdatera basinfo
    if (dto.name) recipe.name = dto.name;
    if (dto.servings) recipe.servings = dto.servings;
    if (dto.description !== undefined) recipe.description = dto.description;

    await this.recipeRepository.save(recipe);

    // Uppdatera items om de finns
    if (dto.items) {
      // Ta bort gamla items
      await this.recipeItemRepository.delete({ recipeId });

      // Lägg till nya items
      const items = dto.items.map((item) =>
        this.recipeItemRepository.create({
          recipeId,
          foodNumber: item.foodNumber,
          foodNameSnapshot: item.foodNameSnapshot,
          grams: item.grams,
        }),
      );

      await this.recipeItemRepository.save(items);
    }

    // Returnera uppdaterat recept
    return this.recipeRepository.findOne({
      where: { id: recipeId },
      relations: ['items'],
    });
  }

  async deleteRecipe(userId: string, recipeId: string) {
    const recipe = await this.getRecipeById(userId, recipeId);
    await this.recipeRepository.remove(recipe);
    return { success: true };
  }
}
