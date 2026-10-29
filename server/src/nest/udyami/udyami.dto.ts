import {
  businessStatusRequestSchema,
  eventStatusRequestSchema,
  eventUpsertRequestSchema,
  businessUpsertRequestSchema,
  nominationCreateRequestSchema,
  nominationStatusRequestSchema,
  spotlightUpsertRequestSchema,
} from '@trek/shared';
import { createZodDto } from 'nestjs-zod';

export class SpotlightUpsertDto extends createZodDto(spotlightUpsertRequestSchema) {}
export class NominationCreateDto extends createZodDto(nominationCreateRequestSchema) {}
export class NominationStatusDto extends createZodDto(nominationStatusRequestSchema) {}
export class BusinessUpsertDto extends createZodDto(businessUpsertRequestSchema) {}
export class BusinessStatusDto extends createZodDto(businessStatusRequestSchema) {}
export class EventUpsertDto extends createZodDto(eventUpsertRequestSchema) {}
export class EventStatusDto extends createZodDto(eventStatusRequestSchema) {}
