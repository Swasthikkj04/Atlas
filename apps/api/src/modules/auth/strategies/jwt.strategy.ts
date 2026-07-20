import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_ACCESS_SECRET ??
        'atlas-development-secret',
    });
  }

  async validate(payload: {
  sub: string;
  email: string;
}) {
  console.log('JWT payload:', payload);

  const user = await this.usersService.findById(payload.sub);

  console.log('User from DB:', user);

  if (!user) {
    throw new UnauthorizedException();
  }

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
  };
}
}