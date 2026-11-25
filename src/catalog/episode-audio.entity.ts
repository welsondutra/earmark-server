import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type AudioFormat = 'opus-ogg' | 'aac-m4a';

/** One encoded rendition of an episode. Android plays Opus, iOS will need AAC later. */
@Entity('episode_audio')
@Index('UQ_episode_audio_format', ['episodeId', 'format'], { unique: true })
export class EpisodeAudio {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  episodeId!: string;

  @Column({ type: 'varchar', length: 16 })
  format!: AudioFormat;

  @Column({ type: 'integer' })
  bitrateKbps!: number;

  /** Random, unguessable object key in the bucket. */
  @Column({ type: 'text' })
  storageKey!: string;

  @Column({ type: 'bigint' })
  sizeBytes!: string;
}
