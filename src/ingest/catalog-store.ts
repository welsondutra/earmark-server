import type { EpisodeStatus, TitleSource } from '../catalog/episode.entity.js';

export interface PodcastRecord {
  id: string;
  slug: string;
}

export interface EpisodeRecord {
  id: string;
  podcastId: string;
  episodeDate: string;
  number: number;
  sourceSha256: string;
  status: EpisodeStatus;
}

export interface EpisodeInput {
  title: string;
  titleSource: TitleSource;
  synopsis: string;
  durationSec: number;
  tags: string[];
  sourceDir: string;
  sourceSha256: string;
}

export interface TopicInput {
  title: string;
  sourceUrl: string | null;
}

/** What the ingest service needs from persistence. The TypeORM adapter implements it. */
export interface CatalogStore {
  ensurePodcast(definition: { slug: string; name: string; description: string; sortOrder: number }): Promise<PodcastRecord>;
  findEpisode(podcastId: string, episodeDate: string): Promise<EpisodeRecord | null>;
  createEpisode(podcastId: string, episodeDate: string, input: EpisodeInput): Promise<EpisodeRecord>;
  /** Replaces the editable fields and puts the episode back to draft so it is encoded again. */
  updateEpisode(id: string, input: EpisodeInput): Promise<void>;
  replaceTopics(episodeId: string, topics: TopicInput[]): Promise<void>;
}

export const CATALOG_STORE = Symbol('CATALOG_STORE');
