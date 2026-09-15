import { RegisterDto } from './dto/register.dto';
import { UserRole } from '../users/user.entity';
import { CarriersService } from '../carriers/carriers.service';
import { DocumentsService } from '../documents/documents.service';
import { DocumentType } from '../documents/document.entity';
import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private carriersService: CarriersService,
    private documentsService: DocumentsService,
    private mailService: MailService,
  ) { }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneWithPassword(email);
    if (user && (await bcrypt.compare(pass, user.password_hash))) {
      if (!user.is_active) {
        throw new ForbiddenException('This account has been suspended. Contact support.');
      }
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }

  async getUserById(id: string) {
    return this.usersService.findById(id);
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(
    registerDto: RegisterDto,
    files?: { [key: string]: Express.Multer.File[] },
  ) {
    try {
      // Check if user exists
      const existingUser = await this.usersService.findOne(registerDto.email);
      if (existingUser) {
        throw new UnauthorizedException('User already exists');
      }

      const emailVerificationToken = crypto.randomBytes(32).toString('hex');

      // Create user
      const newUser = await this.usersService.create({
        email: registerDto.email,
        phone: registerDto.phone,
        password_hash: registerDto.password, // This will be hashed in UsersService
        role: registerDto.role,
        language: registerDto.language || 'en',
        email_verification_token: emailVerificationToken,
      });

      // Best-effort — registration succeeds either way ("easy entrance");
      // this doesn't block login, it's just how we know the address is real.
      this.sendVerificationEmail(newUser.email, emailVerificationToken).catch((err) =>
        console.error('Failed to send verification email:', err),
      );

      // If role is CARRIER, create carrier profile
      if (newUser.role === UserRole.CARRIER) {
        await this.carriersService.create({
          user_id: newUser.id,
          first_name: registerDto.firstName || '',
          last_name: registerDto.lastName || '',
          company_name: registerDto.companyName || '',
          tax_id: registerDto.taxId || '',
          passport_number: registerDto.passportNumber || '',
          bank_name: registerDto.bankName,
          bank_code: registerDto.bankCode,
          bank_account: registerDto.bankAccount,
          currency: registerDto.currency,
          city: registerDto.city,
          country: registerDto.country,
        });

        // Handle file uploads
        if (files) {
          if (files.driverLicense?.[0]) {
            await this.documentsService.uploadFile(
              files.driverLicense[0],
              newUser.id,
              DocumentType.LICENSE,
            );
          }
          if (files.passport?.[0]) {
            await this.documentsService.uploadFile(
              files.passport[0],
              newUser.id,
              DocumentType.PASSPORT,
            );
          }
          if (files.insurance?.[0]) {
            await this.documentsService.uploadFile(
              files.insurance[0],
              newUser.id,
              DocumentType.INSURANCE,
            );
          }
        }
      }

      return this.login(newUser);
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      console.error('Registration Error:', error);
      throw new UnauthorizedException(`Registration failed: ${error.message}`);
    }
  }

  private async sendVerificationEmail(email: string, token: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyUrl = `${frontendUrl}/en/auth/verify-email?token=${token}`;
    await this.mailService.send(
      email,
      'Confirm your email',
      this.mailService.renderNotificationEmail(
        'Confirm your email',
        'Welcome to Logistics Platform! Please confirm your email address to help keep your account secure.',
        'Confirm Email',
        verifyUrl,
      ),
    );
  }

  async verifyEmail(token: string): Promise<{ verified: boolean }> {
    const user = await this.usersService.findByVerificationToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired verification link');
    }
    await this.usersService.update(user.id, {
      email_verified: true,
      email_verification_token: null,
    });
    return { verified: true };
  }

  async resendVerificationEmail(userId: string): Promise<{ sent: boolean }> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new BadRequestException('User not found');
    if (user.email_verified) return { sent: false };

    const token = crypto.randomBytes(32).toString('hex');
    await this.usersService.update(user.id, { email_verification_token: token });
    await this.sendVerificationEmail(user.email, token);
    return { sent: true };
  }
}
