import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminsTable1730453100000 implements MigrationInterface {
  name = 'AddAdminsTable1730453100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "admins" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_admins_user_id" UNIQUE ("user_id"),
        CONSTRAINT "PK_admins_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_admins_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_admins_user_id" ON "admins" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_admins_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admins"`);
  }
}
