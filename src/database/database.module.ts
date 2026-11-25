import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EpisodeAudio } from '../catalog/episode-audio.entity.js';
import { EpisodeTopic } from '../catalog/episode-topic.entity.js';
import { Episode } from '../catalog/episode.entity.js';
import { Podcast } from '../catalog/podcast.entity.js';
import type { Env } from '../config/env.validation.js';
import { CreatePodcastsAndEpisodes1763600000000 } from './migrations/1763600000000-CreatePodcastsAndEpisodes.js';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        type: 'postgres' as const,
        host: config.get('DATABASE_HOST', { infer: true }),
        port: config.get('DATABASE_PORT', { infer: true }),
        username: config.get('DATABASE_USER', { infer: true }),
        password: config.get('DATABASE_PASSWORD', { infer: true }),
        database: config.get('DATABASE_NAME', { infer: true }),
        entities: [Podcast, Episode, EpisodeAudio, EpisodeTopic],
        migrations: [CreatePodcastsAndEpisodes1763600000000],
        migrationsRun: true,
        synchronize: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
