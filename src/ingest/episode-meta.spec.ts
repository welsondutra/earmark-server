import { parseEpisodeMeta } from './episode-meta.js';

const SHA = 'a'.repeat(64);

function valid(overrides: Record<string, unknown> = {}) {
  return {
    schema_version: 1,
    date: '2026-11-23',
    topic: 'tech',
    title: 'Signal limita capturas de tela',
    synopsis: 'Resumo do dia.',
    language: 'pt-BR',
    tags: ['signal', 'seguranca'],
    duration_sec: 1965,
    audio: { file: 'episode.mp3', sha256: SHA },
    stories: [{ title: 'A story', source: 'https://example.com/a' }],
    ...overrides,
  };
}

describe('parseEpisodeMeta', () => {
  it('reads the fields the app needs and ignores the rest', () => {
    const meta = parseEpisodeMeta({ ...valid(), script: 'long text', hosts: [] });
    expect(meta).toMatchObject({
      date: '2026-11-23',
      topic: 'tech',
      title: 'Signal limita capturas de tela',
      durationSec: 1965,
      audioFile: 'episode.mp3',
      audioSha256: SHA,
      tags: ['signal', 'seguranca'],
    });
    expect(meta.stories).toEqual([{ title: 'A story', sourceUrl: 'https://example.com/a' }]);
  });

  it('rejects a missing or oversized title', () => {
    expect(() => parseEpisodeMeta(valid({ title: ' ' }))).toThrow('title');
    expect(() => parseEpisodeMeta(valid({ title: 'x'.repeat(81) }))).toThrow('longer than 80');
  });

  it('rejects a bad date, topic or duration', () => {
    expect(() => parseEpisodeMeta(valid({ date: '23/11/2026' }))).toThrow('YYYY-MM-DD');
    expect(() => parseEpisodeMeta(valid({ topic: '../tech' }))).toThrow('slug');
    expect(() => parseEpisodeMeta(valid({ duration_sec: 0 }))).toThrow('duration_sec');
  });

  it('refuses audio paths that leave the episode folder', () => {
    expect(() => parseEpisodeMeta(valid({ audio: { file: '../x.mp3', sha256: SHA } }))).toThrow('plain file name');
  });

  it('requires a sha256 digest', () => {
    expect(() => parseEpisodeMeta(valid({ audio: { file: 'episode.mp3' } }))).toThrow('audio.sha256');
    expect(() => parseEpisodeMeta(valid({ audio: { file: 'episode.mp3', sha256: 'zz' } }))).toThrow('64 character');
  });

  it('normalises tags and drops duplicates', () => {
    const meta = parseEpisodeMeta(valid({ tags: [' IA ', 'ia', 'Segurança', ''] }));
    expect(meta.tags).toEqual(['ia', 'segurança']);
  });

  it('keeps only http sources for stories', () => {
    const meta = parseEpisodeMeta(valid({ stories: [{ title: 'x', source: 'javascript:alert(1)' }] }));
    expect(meta.stories[0]?.sourceUrl).toBeNull();
  });

  it('rejects input that is not an object', () => {
    expect(() => parseEpisodeMeta(null)).toThrow('root must be an object');
  });
});
