import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAddressFields1730453300000 implements MigrationInterface {
  name = 'AddUserAddressFields1730453300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "address_street" character varying(255),
      ADD COLUMN "address_number" character varying(32),
      ADD COLUMN "address_complement" character varying(128),
      ADD COLUMN "address_neighborhood" character varying(128),
      ADD COLUMN "address_city" character varying(128),
      ADD COLUMN "address_state" character varying(64),
      ADD COLUMN "address_postal_code" character varying(16),
      ADD COLUMN "address_country" character varying(64)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "address_street",
      DROP COLUMN "address_number",
      DROP COLUMN "address_complement",
      DROP COLUMN "address_neighborhood",
      DROP COLUMN "address_city",
      DROP COLUMN "address_state",
      DROP COLUMN "address_postal_code",
      DROP COLUMN "address_country"
    `);
  }
}
