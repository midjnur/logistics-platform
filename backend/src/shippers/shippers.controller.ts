import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/user.entity';
import { ShippersService } from './shippers.service';
import { ShipperVerificationStatus } from './shipper.entity';

@Controller('shippers')
@UseGuards(AuthGuard('jwt'))
export class ShippersController {
  constructor(private shippersService: ShippersService) {}

  @Post('profile')
  async upsertProfile(@Body() body: any, @Request() req: { user: any }) {
    return this.shippersService.upsert(req.user.userId, body);
  }

  @Get('profile')
  async getMyProfile(@Request() req: { user: any }) {
    return this.shippersService.findByUserId(req.user.userId);
  }

  @Get('admin/pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getPending() {
    return this.shippersService.findAllPending();
  }

  @Patch('admin/:id/verify')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async verify(@Param('id') id: string, @Body('status') status: ShipperVerificationStatus) {
    return this.shippersService.updateStatus(id, status);
  }
}
