import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('podcasts')
export class Podcast {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Stable identifier used in storage keys, push topics and the catalog (for example "tech"). */
  @Column({ type: 'varchar', length: 40, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  @Column({ type: 'varchar', length: 12, default: 'pt-BR' })
  language!: string;

  /** Storage key of the podcast cover, set once it has been rendered and uploaded. */
  @Column({ type: 'text', nullable: true })
  coverKey!: string | null;

  @Column({ type: 'integer', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
