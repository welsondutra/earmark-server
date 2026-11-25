import { getMetadataArgsStorage } from 'typeorm';
import { EpisodeAudio } from '../catalog/episode-audio.entity.js';
import { EpisodeTopic } from '../catalog/episode-topic.entity.js';
import { Episode } from '../catalog/episode.entity.js';
import { Podcast } from '../catalog/podcast.entity.js';
import { CreatePodcastsAndEpisodes1763600000000 } from './migrations/1763600000000-CreatePodcastsAndEpisodes.js';

describe('schema', () => {
  it('maps every entity to the table the migration creates', async () => {
    const queries: string[] = [];
    await new CreatePodcastsAndEpisodes1763600000000().up({
      query: async (sql: string) => {
        queries.push(sql);
      },
    } as never);
    const created = queries.join('\n');
    const tables = getMetadataArgsStorage()
      .tables.filter((t) => [Podcast, Episode, EpisodeAudio, EpisodeTopic].includes(t.target as never))
      .map((t) => t.name ?? '');
    expect([...tables].sort((a, b) => a.localeCompare(b))).toEqual(['episode_audio', 'episode_topics', 'episodes', 'podcasts']);
    for (const table of tables) expect(created).toContain(`CREATE TABLE "${table}"`);
  });

  it('keeps one episode per podcast and day and one rendition per format', async () => {
    const queries: string[] = [];
    await new CreatePodcastsAndEpisodes1763600000000().up({
      query: async (sql: string) => {
        queries.push(sql);
      },
    } as never);
    const sql = queries.join('\n');
    expect(sql).toContain('UNIQUE INDEX "UQ_episodes_podcast_date" ON "episodes" ("podcastId", "episodeDate")');
    expect(sql).toContain('UNIQUE INDEX "UQ_episode_audio_format" ON "episode_audio" ("episodeId", "format")');
  });
});
