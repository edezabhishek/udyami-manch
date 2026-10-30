import { UdyamiBusinesses } from '../../db/entities/UdyamiBusinesses.entity';
import { UdyamiSavedBusinesses } from '../../db/entities/UdyamiSavedBusinesses.entity';
import { UdyamiEventRsvps } from '../../db/entities/UdyamiEventRsvps.entity';
import { UdyamiEvents } from '../../db/entities/UdyamiEvents.entity';
import { Users } from '../../db/entities/Users.entity';
import { UdyamiNominations } from '../../db/entities/UdyamiNominations.entity';
import { UdyamiSpotlights } from '../../db/entities/UdyamiSpotlights.entity';
import { UdyamiBusinessesController } from './udyami-businesses.controller';
import { UdyamiBusinessesService } from './udyami-businesses.service';
import { UdyamiEventsController } from './udyami-events.controller';
import { UdyamiGeocodeController } from './udyami-geocode.controller';
import { UdyamiGeocodeService } from './udyami-geocode.service';
import { UdyamiMapController } from './udyami-map.controller';
import { UdyamiEventsService } from './udyami-events.service';
import { UdyamiController } from './udyami.controller';
import { UdyamiService } from './udyami.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/** Udyami Manch: "Udyami of the Month" and nominations. Registered in AppModule. */
@Module({
  imports: [MikroOrmModule.forFeature([UdyamiSpotlights, UdyamiNominations, UdyamiBusinesses, UdyamiSavedBusinesses, UdyamiEvents, UdyamiEventRsvps, Users])],
  controllers: [UdyamiController, UdyamiBusinessesController, UdyamiEventsController, UdyamiMapController, UdyamiGeocodeController],
  providers: [UdyamiService, UdyamiBusinessesService, UdyamiEventsService, UdyamiGeocodeService],
})
export class UdyamiModule {}
