import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { EntriesService } from './entries.service';
import { NutritionCalculationService } from './nutrition-calculation.service';
import {
  CreateFoodEntryDto,
  UpdateFoodEntryDto,
  GetEntriesQueryDto,
  GetDaySummaryQueryDto,
} from '@dietistapp/shared';

@Controller('clients/:clientId/entries')
@UseGuards(JwtAuthGuard)
export class EntriesController {
  constructor(
    private entriesService: EntriesService,
    private nutritionCalculationService: NutritionCalculationService,
  ) {}

  @Get()
  async getEntries(
    @CurrentUser() user: any,
    @Param('clientId') clientId: string,
    @Query() query: GetEntriesQueryDto,
  ) {
    return this.entriesService.getEntries(
      user.id,
      user.role,
      clientId,
      query.from,
      query.to,
    );
  }

  @Post()
  async createEntry(
    @CurrentUser() user: any,
    @Param('clientId') clientId: string,
    @Body() dto: CreateFoodEntryDto,
  ) {
    return this.entriesService.createEntry(user.id, user.role, clientId, dto);
  }

  @Put(':entryId')
  async updateEntry(
    @CurrentUser() user: any,
    @Param('entryId') entryId: string,
    @Body() dto: UpdateFoodEntryDto,
  ) {
    return this.entriesService.updateEntry(user.id, user.role, entryId, dto);
  }

  @Delete(':entryId')
  async deleteEntry(
    @CurrentUser() user: any,
    @Param('entryId') entryId: string,
  ) {
    return this.entriesService.deleteEntry(user.id, user.role, entryId);
  }
}

@Controller('clients/:clientId/summary')
@UseGuards(JwtAuthGuard)
export class SummaryController {
  constructor(
    private nutritionCalculationService: NutritionCalculationService,
    private entriesService: EntriesService,
  ) {}

  @Get('day')
  async getDaySummary(
    @CurrentUser() user: any,
    @Param('clientId') clientId: string,
    @Query() query: GetDaySummaryQueryDto,
  ) {
    // Kontrollera åtkomst först
    await this.entriesService.getEntries(
      user.id,
      user.role,
      clientId,
      query.date,
      query.date,
    );

    return this.nutritionCalculationService.calculateDayNutrition(
      clientId,
      query.date,
    );
  }

  @Get('range')
  async getRangeSummary(
    @CurrentUser() user: any,
    @Param('clientId') clientId: string,
    @Query() query: GetEntriesQueryDto,
  ) {
    // Kontrollera åtkomst först
    await this.entriesService.getEntries(
      user.id,
      user.role,
      clientId,
      query.from,
      query.to,
    );

    return this.nutritionCalculationService.calculateRangeNutrition(
      clientId,
      query.from,
      query.to,
    );
  }
}
