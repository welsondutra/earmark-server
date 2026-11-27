import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EpisodeTopic } from '../catalog/episode-topic.entity.js';
import { Episode } from '../catalog/episode.entity.js';
import { Podcast } from '../catalog/podcast.entity.js';
import type { CatalogStore, EpisodeInput, EpisodeRecord, PodcastRecord, TopicInput } from './catalog-store.js';

function toRecord(episode: Episode): EpisodeRecord {
  return {
    id: episode.id,
    podcastId: episode.podcastId,
    episodeDate: episode.episodeDate,
    number: episode.number,
    sourceSha256: episode.sourceSha256,
    status: episode.status,
  };
}

@Injectable()
export class TypeOrmCatalogStore implements CatalogStore {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async ensurePodcast(definition: { slug: string; name: string; description: string; sortOrder: number }): Promise<PodcastRecord> {
    const repository = this.dataSource.getRepository(Podcast);
    const existing = await repository.findOneBy({ slug: definition.slug });
    if (existing) return { id: existing.id, slug: existing.slug };
    const created = await repository.save(repository.create(definition));
    return { id: created.id, slug: created.slug };
  }

  async findEpisode(podcastId: string, episodeDate: string): Promise<EpisodeRecord | null> {
    const episode = await this.dataSource.getRepository(Episode).findOneBy({ podcastId, episodeDate });
    return episode ? toRecord(episode) : null;
  }

  async createEpisode(podcastId: string, episodeDate: string, input: EpisodeInput): Promise<EpisodeRecord> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Episode);
      const last = await repository.maximum('number', { podcastId });
      const created = await repository.save(
        repository.create({ ...input, podcastId, episodeDate, number: (last ?? 0) + 1, status: 'draft' }),
      );
      return toRecord(created);
    });
  }

  async updateEpisode(id: string, input: EpisodeInput): Promise<void> {
    await this.dataSource.getRepository(Episode).update(id, { ...input, status: 'draft' });
  }

  async replaceTopics(episodeId: string, topics: TopicInput[]): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(EpisodeTopic);
      await repository.delete({ episodeId });
      if (topics.length === 0) return;
      await repository.save(topics.map((topic, position) => repository.create({ episodeId, position, ...topic })));
    });
  }
}
