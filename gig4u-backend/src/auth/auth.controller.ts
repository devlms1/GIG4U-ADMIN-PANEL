import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto, LoginDto, SelectRoleDto, RefreshTokenDto } from './dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../common/types';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/signup
   * Registers a new CLIENT or SP user.
   */
  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new CLIENT or SP user' })
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  /**
   * POST /auth/login
   * Authenticates a user by phone + password.
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with phone and password' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * POST /auth/admin/select-role
   * Completes admin login by selecting a role. Requires tempToken in Authorization header.
   */
  @Public()
  @Post('admin/select-role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin role selection after multi-role login' })
  async selectRole(
    @Body() dto: SelectRoleDto,
    @Headers('authorization') authHeader: string,
  ) {
    const tempToken = authHeader?.replace('Bearer ', '');
    return this.authService.selectRole(dto, tempToken);
  }

  /**
   * POST /auth/refresh
   * Rotates refresh token and issues a new access + refresh token pair.
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  /**
   * POST /auth/logout
   * Revokes refresh tokens and terminates admin sessions.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke tokens' })
  async logout(@CurrentUser() user: JwtPayload) {
    return this.authService.logout(user);
  }

  /**
   * GET /auth/me
   * Returns the current user's profile, roles, and permissions.
   */
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@CurrentUser() user: JwtPayload) {
    return this.authService.getMe(user);
  }
}
