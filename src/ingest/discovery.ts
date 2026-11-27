import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { type EpisodeMeta, parseEpisodeMeta } from './episode-meta.js';

export interface DiscoveredEpisode {
  dir: string;
  audioPath: string;
  meta: EpisodeMeta;
}

export interface DiscoveryResult {
  episodes: DiscoveredEpisode[];
  /** Folders that look like episodes but could not be read. Reported, never fatal. */
  problems: { dir: string; reason: string }[];
}

const DATE_DIR = /^\d{4}-\d{2}-\d{2}$/;

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function subdirectories(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => join(dir, entry.name));
}

/**
 * An episode folder counts only when both meta.json and READY exist. READY missing
 * means the producer is rebuilding it, so it is skipped until it comes back.
 */
async function readEpisode(dir: string): Promise<DiscoveredEpisode | null> {
  const metaPath = join(dir, 'meta.json');
  if (!(await exists(metaPath)) || !(await exists(join(dir, 'READY')))) return null;
  const meta = parseEpisodeMeta(JSON.parse(await readFile(metaPath, 'utf8')));
  const audioPath = join(dir, meta.audioFile);
  if (!(await exists(audioPath))) throw new Error(`audio file ${meta.audioFile} is missing`);
  return { dir, audioPath, meta };
}

/** Scans output/<date>/ (the first topic) and output/<date>/<topic>/ (every other topic). */
export async function discoverEpisodes(outputDir: string): Promise<DiscoveryResult> {
  const result: DiscoveryResult = { episodes: [], problems: [] };
  const dateDirs = (await subdirectories(outputDir)).filter((dir) => DATE_DIR.test(dir.split('/').pop() ?? ''));

  for (const dateDir of dateDirs.sort()) {
    const candidates = [dateDir, ...(await subdirectories(dateDir))];
    for (const dir of candidates) {
      try {
        const episode = await readEpisode(dir);
        if (episode) result.episodes.push(episode);
      } catch (error) {
        result.problems.push({ dir, reason: error instanceof Error ? error.message : String(error) });
      }
    }
  }
  return result;
}
