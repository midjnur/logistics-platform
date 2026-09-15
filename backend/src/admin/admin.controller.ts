import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/user.entity';
import { ShipmentStatus } from '../shipments/shipment.entity';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  async getUsers(
    @Query('role') role?: UserRole,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getUsers(role, search, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 20);
  }

  @Patch('users/:id/status')
  async setUserActive(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.adminService.setUserActive(id, isActive);
  }

  @Get('shipments')
  async getShipments(
    @Query('status') status?: ShipmentStatus,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getShipments(
      status,
      search,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Patch('shipments/:id/status')
  async overrideShipmentStatus(@Param('id') id: string, @Body('status') status: ShipmentStatus) {
    return this.adminService.overrideShipmentStatus(id, status);
  }

  @Post('broadcast')
  async broadcast(@Body() body: { role: 'SHIPPER' | 'CARRIER' | 'ALL'; title: string; message: string }) {
    return this.adminService.broadcast(body.role, body.title, body.message);
  }
}
