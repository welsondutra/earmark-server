import { Inject, Injectable, Logger } from '@nestjs/common';
import { findPodcastDefinition } from '../catalog/podcast-defaults.js';
import { CATALOG_STORE, type CatalogStore, type EpisodeInput } from './catalog-store.js';
import type { DiscoveredEpisode } from './discovery.js';

export type IngestOutcome =
  | { action: 'created' | 'updated' | 'unchanged'; episodeId: string }
  | { action: 'skipped'; reason: string };

@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name);

  constructor(@Inject(CATALOG_STORE) private readonly store: CatalogStore) {}

  /** Idempotent: the same finished episode never creates a second row, and a changed mp3 is picked up again. */
  async ingest(found: DiscoveredEpisode): Promise<IngestOutcome> {
    const { meta } = found;
    const definition = findPodcastDefinition(meta.topic);
    if (!definition) {
      this.logger.warn(`no podcast is defined for topic "${meta.topic}", skipping ${found.dir}`);
      return { action: 'skipped', reason: `unknown topic ${meta.topic}` };
    }

    const podcast = await this.store.ensurePodcast(definition);
    const input: EpisodeInput = {
      title: meta.title,
      titleSource: 'meta',
      synopsis: meta.synopsis,
      durationSec: meta.durationSec,
      tags: meta.tags,
      sourceDir: found.dir,
      sourceSha256: meta.audioSha256,
    };
    const topics = meta.stories.map((story) => ({ title: story.title, sourceUrl: story.sourceUrl }));

    const existing = await this.store.findEpisode(podcast.id, meta.date);
    if (!existing) {
      const created = await this.store.createEpisode(podcast.id, meta.date, input);
      await this.store.replaceTopics(created.id, topics);
      this.logger.log(`ingested ${meta.topic} ${meta.date} as episode ${created.number}`);
      return { action: 'created', episodeId: created.id };
    }

    if (existing.sourceSha256 === meta.audioSha256) return { action: 'unchanged', episodeId: existing.id };

    await this.store.updateEpisode(existing.id, input);
    await this.store.replaceTopics(existing.id, topics);
    this.logger.log(`the audio of ${meta.topic} ${meta.date} changed, it will be encoded again`);
    return { action: 'updated', episodeId: existing.id };
  }
}
