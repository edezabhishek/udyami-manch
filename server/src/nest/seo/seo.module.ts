import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { UdyamiBusinesses } from '../../db/entities/UdyamiBusinesses.entity';
import { UdyamiEvents } from '../../db/entities/UdyamiEvents.entity';
import { SeoController } from './seo.controller';
import { SeoService } from './seo.service';

/** Search-engine and AI-crawler friendly pages: finished HTML, sitemap and robots.txt. */
@Module({
  imports: [MikroOrmModule.forFeature([UdyamiBusinesses, UdyamiEvents])],
  controllers: [SeoController],
  providers: [SeoService],
})
export class SeoModule {}
