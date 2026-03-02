import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminTypeAndTicketValidatedAt1730453400000 implements MigrationInterface {
  name = 'AddAdminTypeAndTicketValidatedAt1730453400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "admins"
      ADD COLUMN "admin_type" character varying(32) NOT NULL DEFAULT 'super_admin'
    `);
    await queryRunner.query(`
      ALTER TABLE "tickets"
      ADD COLUMN "validated_at" TIMESTAMP
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tickets"
      DROP COLUMN "validated_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "admins"
      DROP COLUMN "admin_type"
    `);
  }
}
