/**
 * Port for distributed lock. Used to serialize access to a seat during reservation.
 */
export interface IDistributedLockService {
  acquire(key: string, ttlMs: number): Promise<string | null>;
  release(key: string, token: string): Promise<boolean>;
}
