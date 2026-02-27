import { Module } from '@nestjs/common';
import { ClientProfileController } from './client-profile.controller';
import { ClientProfileService } from './client-profile.service';
import { ClientProfileRepository } from './client-profile.repository';

@Module({
  controllers: [ClientProfileController],
  providers: [ClientProfileService, ClientProfileRepository],
  exports: [ClientProfileService],
})
export class ClientProfileModule {}
