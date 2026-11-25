import { basename } from 'node:path';

export interface EpisodeMeta {
  date: string;
  topic: string;
  title: string;
  synopsis: string;
  language: string;
  tags: string[];
  durationSec: number;
  audioFile: string;
  audioSha256: string;
  stories: { title: string; sourceUrl: string | null }[];
}

const MAX_TITLE = 80;
const MAX_TAGS = 8;

function fail(message: string): never {
  throw new Error(`invalid meta.json: ${message}`);
}

function text(value: unknown, field: string, max?: number): string {
  if (typeof value !== 'string' || value.trim().length === 0) fail(`${field} must be a non-empty string`);
  const trimmed = value.trim();
  if (max !== undefined && trimmed.length > max) fail(`${field} is longer than ${max} characters`);
  return trimmed;
}

function object(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) fail(`${field} must be an object`);
  return value as Record<string, unknown>;
}

function parseStories(value: unknown): EpisodeMeta['stories'] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) fail('stories must be a list');
  return value.map((entry, index) => {
    const story = object(entry, `stories[${index}]`);
    const source = typeof story.source === 'string' && /^https?:\/\//.test(story.source) ? story.source : null;
    return { title: text(story.title, `stories[${index}].title`), sourceUrl: source };
  });
}

/** Validates the News Letter metadata and keeps only what the app needs. Unknown fields are ignored. */
export function parseEpisodeMeta(raw: unknown): EpisodeMeta {
  const meta = object(raw, 'root');
  const date = text(meta.date, 'date');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail('date must look like YYYY-MM-DD');

  const topic = text(meta.topic, 'topic');
  if (!/^[a-z][a-z0-9-]{0,39}$/.test(topic)) fail('topic must be a lowercase slug');

  const audio = object(meta.audio, 'audio');
  const audioFile = text(audio.file, 'audio.file');
  if (basename(audioFile) !== audioFile) fail('audio.file must be a plain file name');
  const audioSha256 = text(audio.sha256, 'audio.sha256').toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(audioSha256)) fail('audio.sha256 must be a 64 character hex digest');

  const durationSec = meta.duration_sec;
  if (typeof durationSec !== 'number' || !Number.isInteger(durationSec) || durationSec < 1) {
    fail('duration_sec must be a positive integer');
  }

  const rawTags = meta.tags ?? [];
  if (!Array.isArray(rawTags) || rawTags.some((tag) => typeof tag !== 'string')) fail('tags must be a list of strings');
  const tags = [...new Set((rawTags as string[]).map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(0, MAX_TAGS);

  return {
    date,
    topic,
    title: text(meta.title, 'title', MAX_TITLE),
    synopsis: text(meta.synopsis, 'synopsis'),
    language: typeof meta.language === 'string' && meta.language ? meta.language : 'pt-BR',
    tags,
    durationSec,
    audioFile,
    audioSha256,
    stories: parseStories(meta.stories),
  };
}
