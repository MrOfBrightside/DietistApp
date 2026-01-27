import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto, UpdateRecipeDto } from '@dietistapp/shared';

@Controller('recipes')
@UseGuards(JwtAuthGuard)
export class RecipesController {
  constructor(private recipesService: RecipesService) {}

  @Get()
  async getRecipes(@CurrentUser() user: any) {
    return this.recipesService.getRecipes(user.id);
  }

  @Post()
  async createRecipe(@CurrentUser() user: any, @Body() dto: CreateRecipeDto) {
    return this.recipesService.createRecipe(user.id, dto);
  }

  @Get(':id')
  async getRecipeById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.recipesService.getRecipeById(user.id, id);
  }

  @Put(':id')
  async updateRecipe(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateRecipeDto,
  ) {
    return this.recipesService.updateRecipe(user.id, id, dto);
  }

  @Delete(':id')
  async deleteRecipe(@CurrentUser() user: any, @Param('id') id: string) {
    return this.recipesService.deleteRecipe(user.id, id);
  }
}
