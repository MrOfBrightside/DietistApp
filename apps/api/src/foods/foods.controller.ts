import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { LivsmedelverketService } from './livsmedelsverket.service';
import { SearchFoodsQueryDto } from '@dietistapp/shared';

@Controller('foods')
@UseGuards(JwtAuthGuard)
export class FoodsController {
  constructor(private livsmedelverketService: LivsmedelverketService) {}

  @Get('search')
  async searchFoods(@Query() query: SearchFoodsQueryDto) {
    if (!query.q || query.q.length < 2) {
      throw new HttpException(
        'Sökfråga måste vara minst 2 tecken',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.livsmedelverketService.searchFoods(
      query.q,
      query.limit || 20,
    );
  }

  @Get(':foodNumber')
  async getFoodByNumber(@Param('foodNumber') foodNumber: string) {
    return this.livsmedelverketService.getFoodByNumber(foodNumber);
  }

  @Get(':foodNumber/nutrients')
  async getNutrientsByFoodNumber(@Param('foodNumber') foodNumber: string) {
    const data = await this.livsmedelverketService.getNutrientsByFoodNumber(
      foodNumber,
    );
    const staleInfo = await this.livsmedelverketService.isCacheStale(
      foodNumber,
    );

    return {
      ...data,
      _cache: staleInfo,
    };
  }
}
