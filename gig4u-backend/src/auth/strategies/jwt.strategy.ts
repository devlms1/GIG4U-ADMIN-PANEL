import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../../common/types';

/**
 * Validates access tokens from the Authorization: Bearer header.
 * Attaches the decoded JwtPayload to request.user.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  /**
   * Passport calls this after signature verification.
   * Returned value becomes request.user.
   */
  validate(payload: JwtPayload): JwtPayload {
    return {
      sub: payload.sub,
      userType: payload.userType,
      roles: payload.roles,
      permissions: payload.permissions,
      tenantId: payload.tenantId,
      jti: payload.jti,
    };
  }
}
