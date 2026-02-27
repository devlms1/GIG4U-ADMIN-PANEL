import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../../common/types';

/**
 * Validates refresh tokens. Used only by the /auth/refresh endpoint.
 * The refresh token is sent in the request body but verified here for signature.
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });
  }

  /**
   * Passport calls this after signature verification.
   */
  validate(payload: JwtPayload): JwtPayload {
    return {
      sub: payload.sub,
      userType: payload.userType,
      roles: payload.roles,
      permissions: payload.permissions,
      tenantId: payload.tenantId,
    };
  }
}
