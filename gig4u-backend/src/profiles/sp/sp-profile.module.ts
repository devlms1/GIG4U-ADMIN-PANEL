import { Module } from '@nestjs/common';
import { SpProfileController } from './sp-profile.controller';
import { SpProfileService } from './sp-profile.service';
import { SpProfileRepository } from './sp-profile.repository';

@Module({
  controllers: [SpProfileController],
  providers: [SpProfileService, SpProfileRepository],
  exports: [SpProfileService],
})
export class SpProfileModule {}
