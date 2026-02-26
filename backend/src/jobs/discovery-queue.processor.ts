import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../modules/users/entities/user.entity';
import { DiscoveryService } from '../modules/discovery/discovery.service';

@Processor('discovery-deck')
@Injectable()
export class DiscoveryQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(DiscoveryQueueProcessor.name);

  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private discoveryService: DiscoveryService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Generating daily decks... job ${job.id}`);

    const today = new Date().toISOString().split('T')[0];

    // Get all active users who need a deck today
    const users = await this.usersRepo.find({
      where: { isActive: true, isBanned: false, dataDeletionRequested: false },
      select: ['id'],
    });

    this.logger.log(`Generating decks for ${users.length} users`);

    for (const user of users) {
      try {
        await this.discoveryService.generateDeckForUser(user.id, today);
      } catch (err) {
        this.logger.error(`Failed to generate deck for user ${user.id}`, err);
      }
    }

    this.logger.log('Daily deck generation complete');
  }
}
