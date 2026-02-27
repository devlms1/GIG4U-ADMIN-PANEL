import { Module } from '@nestjs/common';
import { AdminProfileController } from './admin-profile.controller';
import { AdminProfileService } from './admin-profile.service';
import { AdminProfileRepository } from './admin-profile.repository';

@Module({
  controllers: [AdminProfileController],
  providers: [AdminProfileService, AdminProfileRepository],
  exports: [AdminProfileService],
})
export class AdminProfileModule {}
