import {
  Controller,
  Request,
  Post,
  UseGuards,
  Body,
  Get,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { RegisterDto } from './dto/register.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('login')
  async login(@Body() req: { email: string; password: string }) {
    const user = await this.authService.validateUser(req.email, req.password);
    if (!user) {
      return { message: 'Invalid credentials' };
    }
    return this.authService.login(user);
  }

  @Post('register')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'driverLicense', maxCount: 1 },
      { name: 'passport', maxCount: 1 },
      { name: 'insurance', maxCount: 1 },
    ]),
  )
  async register(
    @Body() body: RegisterDto,
    @UploadedFiles()
    files: {
      driverLicense?: Express.Multer.File[];
      passport?: Express.Multer.File[];
      insurance?: Express.Multer.File[];
    },
  ) {
    return this.authService.register(body, files);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getProfile(@Request() req: { user: any }) {
    // Fetch full user details including carrier profile
    const user = await this.authService.getUserById(req.user.userId);
    return user;
  }
}
