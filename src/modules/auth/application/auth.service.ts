import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AdminRepository } from '../../admin/infrastructure/admin.repository';
import { User } from '../domain/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export interface LoginResult {
  access_token: string;
  expires_in: string;
}

export type UserForLogin = Omit<User, 'passwordHash'>;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly adminRepository: AdminRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, plainPassword: string): Promise<UserForLogin | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) return null;
    const isMatch = await bcrypt.compare(plainPassword, user.passwordHash);
    if (!isMatch) return null;
    const { passwordHash: _omit, ...rest } = user;
    return rest;
  }

  async login(user: UserForLogin): Promise<LoginResult> {
    const isAdmin = await this.adminRepository.existsByUserId(user.id);
    const role = isAdmin ? 'admin' : 'user';
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role,
    };
    const expiresInStr = this.configService.get<string>('jwt.expiresIn') ?? '1d';
    const expiresInSeconds = expiresInStr === '1d' ? 86400 : parseInt(expiresInStr, 10) || 86400;
    const access_token = this.jwtService.sign(
      { ...payload },
      { expiresIn: expiresInSeconds },
    );
    return { access_token, expires_in: expiresInStr };
  }

  async loginWithCredentials(email: string, password: string): Promise<LoginResult> {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.login(user);
  }

  /**
   * Registers a new user. Throws ConflictException if email is already in use.
   * Address is optional (for billing). Returns login result so the user is authenticated after registration.
   */
  async register(
    email: string,
    password: string,
    address?: {
      street?: string;
      number?: string;
      complement?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    },
  ): Promise<LoginResult> {
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.userRepository.save(
      this.userRepository.create({
        email,
        passwordHash,
        addressStreet: address?.street?.trim() ?? null,
        addressNumber: address?.number?.trim() ?? null,
        addressComplement: address?.complement?.trim() ?? null,
        addressNeighborhood: address?.neighborhood?.trim() ?? null,
        addressCity: address?.city?.trim() ?? null,
        addressState: address?.state?.trim() ?? null,
        addressPostalCode: address?.postalCode?.trim() ?? null,
        addressCountry: address?.country?.trim() ?? null,
      }),
    );
    const { passwordHash: _omit, ...userForLogin } = user;
    return this.login(userForLogin as UserForLogin);
  }

  /**
   * Seeds an admin when ADMIN_EMAIL and ADMIN_PASSWORD are set and no admin exists.
   * Creates a User and an Admin row (single source of truth for admin privileges).
   */
  async seedAdminIfConfigured(): Promise<void> {
    const email = this.configService.get<string>('admin.seedEmail');
    const password = this.configService.get<string>('admin.seedPassword');
    if (!email || !password) return;
    let user = await this.userRepository.findOne({ where: { email } });
    if (user) {
      const alreadyAdmin = await this.adminRepository.existsByUserId(user.id);
      if (alreadyAdmin) return;
      await this.adminRepository.createForUser(user.id);
      return;
    }
    const hash = await bcrypt.hash(password, 10);
    user = await this.userRepository.save(
      this.userRepository.create({ email, passwordHash: hash }),
    );
    await this.adminRepository.createForUser(user.id);
  }
}
