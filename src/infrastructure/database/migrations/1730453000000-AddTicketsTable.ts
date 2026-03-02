import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTicketsTable1730453000000 implements MigrationInterface {
  name = 'AddTicketsTable1730453000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tickets" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "reservation_id" uuid NOT NULL,
        "order_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "event_id" uuid NOT NULL,
        "session_id" uuid NOT NULL,
        "seat_id" uuid NOT NULL,
        "qr_payload" character varying(512) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_tickets_reservation_id" UNIQUE ("reservation_id"),
        CONSTRAINT "PK_tickets_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tickets_reservation_id" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id"),
        CONSTRAINT "FK_tickets_order_id" FOREIGN KEY ("order_id") REFERENCES "orders"("id"),
        CONSTRAINT "FK_tickets_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_tickets_user_id" ON "tickets" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tickets_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tickets"`);
  }
}
