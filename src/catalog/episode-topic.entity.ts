import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** A story covered in an episode: feeds chapters and search. */
@Entity('episode_topics')
@Index('IDX_episode_topics_episode', ['episodeId', 'position'])
export class EpisodeTopic {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  episodeId!: string;

  @Column({ type: 'integer' })
  position!: number;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text', nullable: true })
  sourceUrl!: string | null;
}
