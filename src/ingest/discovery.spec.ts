import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { discoverEpisodes } from './discovery.js';

const SHA = 'b'.repeat(64);

function meta(topic: string, date: string) {
  return JSON.stringify({
    date,
    topic,
    title: `${topic} episode`,
    synopsis: 'Summary',
    tags: ['one'],
    duration_sec: 600,
    audio: { file: 'episode.mp3', sha256: SHA },
  });
}

async function episodeDir(root: string, path: string[], options: { ready?: boolean; topic: string; date: string }) {
  const dir = join(root, ...path);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'meta.json'), meta(options.topic, options.date));
  await writeFile(join(dir, 'episode.mp3'), 'audio');
  if (options.ready !== false) await writeFile(join(dir, 'READY'), '');
}

describe('discoverEpisodes', () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'earmark-'));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('finds the first topic in the date folder and others in sub folders', async () => {
    await episodeDir(root, ['2026-11-23'], { topic: 'tech', date: '2026-11-23' });
    await episodeDir(root, ['2026-11-23', 'rest'], { topic: 'rest', date: '2026-11-23' });
    const { episodes, problems } = await discoverEpisodes(root);
    expect(problems).toEqual([]);
    expect(episodes.map((e) => e.meta.topic)).toEqual(['tech', 'rest']);
  });

  it('skips a folder without READY because it is being rebuilt', async () => {
    await episodeDir(root, ['2026-11-23'], { topic: 'tech', date: '2026-11-23', ready: false });
    const { episodes, problems } = await discoverEpisodes(root);
    expect(episodes).toEqual([]);
    expect(problems).toEqual([]);
  });

  it('ignores folders that are not dates', async () => {
    await episodeDir(root, ['samples'], { topic: 'tech', date: '2026-11-23' });
    expect((await discoverEpisodes(root)).episodes).toEqual([]);
  });

  it('reports a broken meta.json without stopping the scan', async () => {
    await episodeDir(root, ['2026-11-22'], { topic: 'tech', date: '2026-11-22' });
    await mkdir(join(root, '2026-11-23'));
    await writeFile(join(root, '2026-11-23', 'meta.json'), '{ not json');
    await writeFile(join(root, '2026-11-23', 'READY'), '');
    const { episodes, problems } = await discoverEpisodes(root);
    expect(episodes).toHaveLength(1);
    expect(problems).toHaveLength(1);
    expect(problems[0]?.dir).toContain('2026-11-23');
  });

  it('reports a missing audio file', async () => {
    await episodeDir(root, ['2026-11-23'], { topic: 'tech', date: '2026-11-23' });
    await rm(join(root, '2026-11-23', 'episode.mp3'));
    const { problems } = await discoverEpisodes(root);
    expect(problems[0]?.reason).toContain('episode.mp3');
  });

  it('returns episodes in date order', async () => {
    await episodeDir(root, ['2026-11-24'], { topic: 'tech', date: '2026-11-24' });
    await episodeDir(root, ['2026-11-22'], { topic: 'tech', date: '2026-11-22' });
    const { episodes } = await discoverEpisodes(root);
    expect(episodes.map((e) => e.meta.date)).toEqual(['2026-11-22', '2026-11-24']);
  });
});
