import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * User entity. Identity for authentication. Admin privileges are determined by
 * the presence of a row in the admins table (Admin entity), not by a role on User.
 * Address fields are used for billing (faturamento).
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ name: 'address_street', type: 'varchar', length: 255, nullable: true })
  addressStreet: string | null;

  @Column({ name: 'address_number', type: 'varchar', length: 32, nullable: true })
  addressNumber: string | null;

  @Column({ name: 'address_complement', type: 'varchar', length: 128, nullable: true })
  addressComplement: string | null;

  @Column({ name: 'address_neighborhood', type: 'varchar', length: 128, nullable: true })
  addressNeighborhood: string | null;

  @Column({ name: 'address_city', type: 'varchar', length: 128, nullable: true })
  addressCity: string | null;

  @Column({ name: 'address_state', type: 'varchar', length: 64, nullable: true })
  addressState: string | null;

  @Column({ name: 'address_postal_code', type: 'varchar', length: 16, nullable: true })
  addressPostalCode: string | null;

  @Column({ name: 'address_country', type: 'varchar', length: 64, nullable: true })
  addressCountry: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
