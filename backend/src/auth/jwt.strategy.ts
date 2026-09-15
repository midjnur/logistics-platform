import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secretKey',
    });
  }

  async validate(payload: any) {
    // Checked on every request (not just at login) so a suspension takes
    // effect immediately, even for a token issued before the suspension.
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.is_active) {
      throw new UnauthorizedException('This account has been suspended or no longer exists');
    }
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
