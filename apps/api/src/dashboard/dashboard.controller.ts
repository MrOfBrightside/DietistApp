import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@dietistapp/shared';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DIETITIAN, UserRole.ADMIN)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(@CurrentUser() user: any) {
    return this.dashboardService.getDashboardStats(user.id);
  }

  @Get('clients')
  async getClients(@CurrentUser() user: any) {
    return this.dashboardService.getClients(user.id);
  }
}
