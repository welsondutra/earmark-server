import type { CatalogStore, EpisodeInput, EpisodeRecord } from './catalog-store.js';
import type { DiscoveredEpisode } from './discovery.js';
import { IngestService } from './ingest.service.js';

class MemoryStore implements CatalogStore {
  podcasts = new Map<string, { id: string; slug: string }>();
  episodes: (EpisodeRecord & EpisodeInput)[] = [];
  topics = new Map<string, string[]>();

  async ensurePodcast(definition: { slug: string }) {
    const found = this.podcasts.get(definition.slug) ?? { id: `p-${definition.slug}`, slug: definition.slug };
    this.podcasts.set(definition.slug, found);
    return found;
  }

  async findEpisode(podcastId: string, episodeDate: string) {
    return this.episodes.find((e) => e.podcastId === podcastId && e.episodeDate === episodeDate) ?? null;
  }

  async createEpisode(podcastId: string, episodeDate: string, input: EpisodeInput) {
    const number = this.episodes.filter((e) => e.podcastId === podcastId).length + 1;
    const record = { id: `e-${this.episodes.length + 1}`, podcastId, episodeDate, number, status: 'draft' as const, ...input };
    this.episodes.push(record);
    return record;
  }

  async updateEpisode(id: string, input: EpisodeInput) {
    const index = this.episodes.findIndex((e) => e.id === id);
    this.episodes[index] = { ...this.episodes[index]!, ...input, status: 'draft' };
  }

  async replaceTopics(episodeId: string, topics: { title: string }[]) {
    this.topics.set(episodeId, topics.map((t) => t.title));
  }
}

function found(overrides: Partial<DiscoveredEpisode['meta']> = {}): DiscoveredEpisode {
  return {
    dir: '/out/2026-11-23',
    audioPath: '/out/2026-11-23/episode.mp3',
    meta: {
      date: '2026-11-23',
      topic: 'tech',
      title: 'A title',
      synopsis: 'Summary',
      language: 'pt-BR',
      tags: ['one'],
      durationSec: 600,
      audioFile: 'episode.mp3',
      audioSha256: 'a'.repeat(64),
      stories: [{ title: 'First', sourceUrl: null }, { title: 'Second', sourceUrl: 'https://example.com' }],
      ...overrides,
    },
  };
}

describe('IngestService', () => {
  it('creates a draft episode with its topics', async () => {
    const store = new MemoryStore();
    const outcome = await new IngestService(store).ingest(found());
    expect(outcome.action).toBe('created');
    expect(store.episodes[0]).toMatchObject({ number: 1, status: 'draft', title: 'A title' });
    expect([...store.topics.values()][0]).toEqual(['First', 'Second']);
  });

  it('does nothing when the same episode is ingested twice', async () => {
    const store = new MemoryStore();
    const service = new IngestService(store);
    await service.ingest(found());
    const second = await service.ingest(found());
    expect(second.action).toBe('unchanged');
    expect(store.episodes).toHaveLength(1);
  });

  it('updates the episode and returns it to draft when the audio changed', async () => {
    const store = new MemoryStore();
    const service = new IngestService(store);
    await service.ingest(found());
    store.episodes[0]!.status = 'published';
    const outcome = await service.ingest(found({ audioSha256: 'b'.repeat(64), title: 'Fixed title' }));
    expect(outcome.action).toBe('updated');
    expect(store.episodes[0]).toMatchObject({ status: 'draft', title: 'Fixed title', sourceSha256: 'b'.repeat(64) });
  });

  it('numbers episodes per podcast', async () => {
    const store = new MemoryStore();
    const service = new IngestService(store);
    await service.ingest(found());
    await service.ingest(found({ date: '2026-11-24' }));
    await service.ingest(found({ topic: 'rest' }));
    expect(store.episodes.map((e) => e.number)).toEqual([1, 2, 1]);
  });

  it('skips a topic that has no podcast', async () => {
    const outcome = await new IngestService(new MemoryStore()).ingest(found({ topic: 'sports' }));
    expect(outcome).toEqual({ action: 'skipped', reason: 'unknown topic sports' });
  });
});
