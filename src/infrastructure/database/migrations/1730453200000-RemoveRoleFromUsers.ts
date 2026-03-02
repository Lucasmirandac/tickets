import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveRoleFromUsers1730453200000 implements MigrationInterface {
  name = 'RemoveRoleFromUsers1730453200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "role"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "role" character varying(32) NOT NULL DEFAULT 'user'
    `);
  }
}
