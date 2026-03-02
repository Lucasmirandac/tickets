import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDescriptionAndUsers1730452900000 implements MigrationInterface {
  name = 'AddDescriptionAndUsers1730452900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events"
      ADD COLUMN "description" text
    `);
    await queryRunner.query(`
      ALTER TABLE "sessions"
      ADD COLUMN "description" text,
      ADD COLUMN "ends_at" TIMESTAMP
    `);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying(255) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "role" character varying(32) NOT NULL DEFAULT 'user',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`
      ALTER TABLE "sessions"
      DROP COLUMN "description",
      DROP COLUMN "ends_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "events"
      DROP COLUMN "description"
    `);
  }
}
