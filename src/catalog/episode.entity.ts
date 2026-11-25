import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type EpisodeStatus = 'draft' | 'ready' | 'published' | 'archived';
export type TitleSource = 'meta' | 'generated' | 'fallback';

@Entity('episodes')
@Index('UQ_episodes_podcast_date', ['podcastId', 'episodeDate'], { unique: true })
export class Episode {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  podcastId!: string;

  @Column({ type: 'date' })
  episodeDate!: string;

  /** Sequence number inside the podcast, starting at 1. */
  @Column({ type: 'integer' })
  number!: number;

  @Column({ type: 'varchar', length: 80 })
  title!: string;

  @Column({ type: 'varchar', length: 12, default: 'meta' })
  titleSource!: TitleSource;

  @Column({ type: 'text' })
  synopsis!: string;

  @Column({ type: 'integer' })
  durationSec!: number;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  tags!: string[];

  @Column({ type: 'text', nullable: true })
  coverKey!: string | null;

  @Column({ type: 'varchar', length: 12, default: 'draft' })
  status!: EpisodeStatus;

  /** The episode becomes visible and triggers a push at this moment. */
  @Column({ type: 'timestamptz', nullable: true })
  publishAt!: Date | null;

  /** Folder the episode was read from, kept for troubleshooting. */
  @Column({ type: 'text' })
  sourceDir!: string;

  /** sha256 of the source mp3, used to notice when the finished file changes. */
  @Column({ type: 'varchar', length: 64 })
  sourceSha256!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
