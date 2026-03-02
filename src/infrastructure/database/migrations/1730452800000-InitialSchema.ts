import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1730452800000 implements MigrationInterface {
  name = 'InitialSchema1730452800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(255) NOT NULL,
        "slug" character varying(255) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_events_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_events_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "event_id" uuid NOT NULL,
        "starts_at" TIMESTAMP NOT NULL,
        "venue" character varying(255) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sessions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sessions_event_id" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "seats" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "session_id" uuid NOT NULL,
        "row" character varying(32) NOT NULL,
        "number" character varying(32) NOT NULL,
        "status" character varying(32) NOT NULL DEFAULT 'available',
        "version" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_seats_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_seats_session_id" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "reservations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "seat_id" uuid NOT NULL,
        "session_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "token" character varying(64) NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "status" character varying(32) NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reservations_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_reservations_seat_id" FOREIGN KEY ("seat_id") REFERENCES "seats"("id"),
        CONSTRAINT "FK_reservations_session_id" FOREIGN KEY ("session_id") REFERENCES "sessions"("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "status" character varying(32) NOT NULL DEFAULT 'pending',
        "total" decimal(10,2) NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_orders_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "order_id" uuid NOT NULL,
        "gateway_id" character varying(255) NOT NULL,
        "status" character varying(32) NOT NULL DEFAULT 'pending',
        "amount" decimal(10,2) NOT NULL,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payments_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_payments_order_id" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "order_reservations" (
        "order_id" uuid NOT NULL,
        "reservation_id" uuid NOT NULL,
        CONSTRAINT "PK_order_reservations" PRIMARY KEY ("order_id", "reservation_id"),
        CONSTRAINT "FK_order_reservations_order_id" FOREIGN KEY ("order_id") REFERENCES "orders"("id"),
        CONSTRAINT "FK_order_reservations_reservation_id" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "order_reservations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orders"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reservations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "seats"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "events"`);
  }
}
