import type { User } from '../../types';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { OptionalAuth } from '../auth-core/public.decorator';
import { viewer } from './viewer';
import { ResponseContract } from '../common/response-contract';
import { EventStatusDto, EventUpsertDto } from './udyami.dto';
import { EventAccessError, UdyamiEventsService } from './udyami-events.service';
import { Body, Controller, Delete, Get, HttpCode, HttpException, Param, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { eventListResponseSchema, eventListScopeSchema, eventResponseSchema, type EventListResponse, type UdyamiEvent } from '@trek/shared';

async function guarded<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (err) {
    if (err instanceof EventAccessError) {
      if (err.kind === 'forbidden') throw new HttpException({ error: 'Not allowed' }, 403);
      throw new HttpException({ error: 'Event not found' }, 404);
    }
    throw err;
  }
}

/** /api/udyami/events — online events. */
@Controller('api/udyami/events')
export class UdyamiEventsController {
  constructor(private readonly events: UdyamiEventsService) {}

  @Get()
  @OptionalAuth('the public events list: anyone can see approved online events')
  @ResponseContract(eventListResponseSchema)
  async list(@CurrentUser() user: User | undefined, @Query('scope') scope?: string): Promise<EventListResponse> {
    const parsed = eventListScopeSchema.safeParse(scope ?? 'upcoming');
    if (!parsed.success) throw new HttpException({ error: 'Invalid scope' }, 400);
    return { events: await guarded(() => this.events.list(viewer(user), parsed.data)) };
  }

  @Get(':id')
  @OptionalAuth('the public events list: anyone can open an approved event')
  @ResponseContract(eventResponseSchema)
  async get(@CurrentUser() user: User | undefined, @Param('id', ParseIntPipe) id: number): Promise<{ event: UdyamiEvent }> {
    return { event: await guarded(() => this.events.get(viewer(user), id)) };
  }

  @Post()
  @ResponseContract(eventResponseSchema)
  async create(@CurrentUser() user: User, @Body() body: EventUpsertDto): Promise<{ event: UdyamiEvent }> {
    return { event: await this.events.create(user, body) };
  }

  @Put(':id')
  @ResponseContract(eventResponseSchema)
  async update(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number, @Body() body: EventUpsertDto): Promise<{ event: UdyamiEvent }> {
    return { event: await guarded(() => this.events.update(user, id, body)) };
  }

  @Delete(':id')
  async remove(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number): Promise<{ success: boolean }> {
    await guarded(() => this.events.remove(user, id));
    return { success: true };
  }

  @Post(':id/rsvp')
  @HttpCode(200)
  @ResponseContract(eventResponseSchema)
  async rsvp(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number): Promise<{ event: UdyamiEvent }> {
    return { event: await guarded(() => this.events.setGoing(user, id, true)) };
  }

  @Delete(':id/rsvp')
  @ResponseContract(eventResponseSchema)
  async unrsvp(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number): Promise<{ event: UdyamiEvent }> {
    return { event: await guarded(() => this.events.setGoing(user, id, false)) };
  }

  @Patch(':id/status')
  @HttpCode(200)
  @ResponseContract(eventResponseSchema)
  async setStatus(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number, @Body() body: EventStatusDto): Promise<{ event: UdyamiEvent }> {
    return { event: await guarded(() => this.events.setStatus(user, id, body.status)) };
  }
}
