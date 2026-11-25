import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePodcastsAndEpisodes1763600000000 implements MigrationInterface {
  name = 'CreatePodcastsAndEpisodes1763600000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`
      CREATE TABLE "podcasts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "slug" varchar(40) NOT NULL,
        "name" varchar(120) NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "language" varchar(12) NOT NULL DEFAULT 'pt-BR',
        "coverKey" text,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_podcasts_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_podcasts_slug" UNIQUE ("slug")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "episodes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "podcastId" uuid NOT NULL,
        "episodeDate" date NOT NULL,
        "number" integer NOT NULL,
        "title" varchar(80) NOT NULL,
        "titleSource" varchar(12) NOT NULL DEFAULT 'meta',
        "synopsis" text NOT NULL,
        "durationSec" integer NOT NULL,
        "tags" text[] NOT NULL DEFAULT '{}',
        "coverKey" text,
        "status" varchar(12) NOT NULL DEFAULT 'draft',
        "publishAt" timestamptz,
        "sourceDir" text NOT NULL,
        "sourceSha256" varchar(64) NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_episodes_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_episodes_podcast" FOREIGN KEY ("podcastId") REFERENCES "podcasts"("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_episodes_status" CHECK ("status" IN ('draft', 'ready', 'published', 'archived'))
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_episodes_podcast_date" ON "episodes" ("podcastId", "episodeDate")`);
    await queryRunner.query(`CREATE INDEX "IDX_episodes_status_publish" ON "episodes" ("status", "publishAt")`);
    await queryRunner.query(`
      CREATE TABLE "episode_audio" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "episodeId" uuid NOT NULL,
        "format" varchar(16) NOT NULL,
        "bitrateKbps" integer NOT NULL,
        "storageKey" text NOT NULL,
        "sizeBytes" bigint NOT NULL,
        CONSTRAINT "PK_episode_audio_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_episode_audio_episode" FOREIGN KEY ("episodeId") REFERENCES "episodes"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_episode_audio_format" ON "episode_audio" ("episodeId", "format")`);
    await queryRunner.query(`
      CREATE TABLE "episode_topics" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "episodeId" uuid NOT NULL,
        "position" integer NOT NULL,
        "title" text NOT NULL,
        "sourceUrl" text,
        CONSTRAINT "PK_episode_topics_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_episode_topics_episode" FOREIGN KEY ("episodeId") REFERENCES "episodes"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_episode_topics_episode" ON "episode_topics" ("episodeId", "position")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "episode_topics"`);
    await queryRunner.query(`DROP TABLE "episode_audio"`);
    await queryRunner.query(`DROP TABLE "episodes"`);
    await queryRunner.query(`DROP TABLE "podcasts"`);
  }
}
