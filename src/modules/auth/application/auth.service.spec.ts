import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AdminRepository } from '../../admin/infrastructure/admin.repository';
import { User } from '../domain/user.entity';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepository: jest.Mocked<Pick<Repository<User>, 'findOne' | 'save' | 'create'>>;
  let mockAdminRepository: jest.Mocked<Pick<AdminRepository, 'existsByUserId' | 'createForUser'>>;
  let mockJwtService: jest.Mocked<Pick<JwtService, 'sign'>>;
  let mockConfigService: jest.Mocked<Pick<ConfigService, 'get'>>;

  const userId = '11111111-1111-1111-1111-111111111111';
  const email = 'user@example.com';
  const passwordHash = 'hashed';
  const mockUser: User = {
    id: userId,
    email,
    passwordHash,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  beforeEach(async () => {
    mockUserRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };
    mockAdminRepository = {
      existsByUserId: jest.fn(),
      createForUser: jest.fn(),
    };
    mockJwtService = {
      sign: jest.fn().mockReturnValue('jwt-token'),
    };
    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => (key === 'jwt.expiresIn' ? '1d' : '')),
    };
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: AdminRepository, useValue: mockAdminRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('should return null when user is not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const actual = await service.validateUser(email, 'password');

      expect(actual).toBeNull();
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email } });
    });

    it('should return null when password does not match', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const actual = await service.validateUser(email, 'wrong');

      expect(actual).toBeNull();
      expect(bcrypt.compare).toHaveBeenCalledWith('wrong', passwordHash);
    });

    it('should return user without passwordHash when credentials are valid', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const actual = await service.validateUser(email, 'password');

      expect(actual).not.toBeNull();
      expect(actual?.id).toBe(userId);
      expect(actual?.email).toBe(email);
      expect((actual as { passwordHash?: string }).passwordHash).toBeUndefined();
    });
  });

  describe('login', () => {
    it('should set role to admin when user is admin', async () => {
      mockAdminRepository.existsByUserId.mockResolvedValue(true);
      const user = { id: userId, email, createdAt: new Date(), updatedAt: new Date() };

      const actual = await service.login(user);

      expect(actual.access_token).toBe('jwt-token');
      expect(actual.expires_in).toBe('1d');
      expect(mockAdminRepository.existsByUserId).toHaveBeenCalledWith(userId);
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: userId, email, role: 'admin' }),
        expect.any(Object),
      );
    });

    it('should set role to user when user is not admin', async () => {
      mockAdminRepository.existsByUserId.mockResolvedValue(false);
      const user = { id: userId, email, createdAt: new Date(), updatedAt: new Date() };

      const actual = await service.login(user);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'user' }),
        expect.any(Object),
      );
    });
  });

  describe('register', () => {
    it('should throw ConflictException when email is already registered', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.register(email, 'password')).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(email, 'password')).rejects.toThrow(
        'Email already registered',
      );
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should create user and return login result when email is available', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser as User);
      mockUserRepository.save.mockResolvedValue(mockUser as User);
      mockAdminRepository.existsByUserId.mockResolvedValue(false);

      const actual = await service.register(email, 'password');

      expect(actual.access_token).toBe('jwt-token');
      expect(actual.expires_in).toBe('1d');
      expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email,
          passwordHash: 'hashed',
          addressStreet: null,
          addressCity: null,
          addressPostalCode: null,
        }),
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ email, role: 'user' }),
        expect.any(Object),
      );
    });

    it('should create user with address when address is provided', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      const userWithAddress = {
        ...mockUser,
        addressStreet: 'Rua A',
        addressNumber: '100',
        addressCity: 'São Paulo',
        addressState: 'SP',
        addressPostalCode: '01234-567',
        addressCountry: 'Brasil',
      };
      mockUserRepository.create.mockReturnValue(userWithAddress as User);
      mockUserRepository.save.mockResolvedValue(userWithAddress as User);
      mockAdminRepository.existsByUserId.mockResolvedValue(false);

      const actual = await service.register(email, 'password', {
        street: 'Rua A',
        number: '100',
        city: 'São Paulo',
        state: 'SP',
        postalCode: '01234-567',
        country: 'Brasil',
      });

      expect(actual.access_token).toBe('jwt-token');
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email,
          passwordHash: 'hashed',
          addressStreet: 'Rua A',
          addressNumber: '100',
          addressCity: 'São Paulo',
          addressState: 'SP',
          addressPostalCode: '01234-567',
          addressCountry: 'Brasil',
        }),
      );
    });
  });

  describe('loginWithCredentials', () => {
    it('should throw UnauthorizedException when user is invalid', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.loginWithCredentials(email, 'pass')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.loginWithCredentials(email, 'pass')).rejects.toThrow(
        'Invalid email or password',
      );
    });

    it('should return login result when credentials are valid', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockAdminRepository.existsByUserId.mockResolvedValue(false);

      const actual = await service.loginWithCredentials(email, 'password');

      expect(actual.access_token).toBe('jwt-token');
      expect(actual.expires_in).toBe('1d');
    });
  });

  describe('seedAdminIfConfigured', () => {
    it('should do nothing when email or password is not configured', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'admin.seedEmail') return '';
        if (key === 'admin.seedPassword') return 'p';
        return '';
      });

      await service.seedAdminIfConfigured();

      expect(mockUserRepository.findOne).not.toHaveBeenCalled();
    });

    it('should create Admin for existing user when user exists but is not admin', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'admin.seedEmail') return email;
        if (key === 'admin.seedPassword') return 'password';
        return '';
      });
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockAdminRepository.existsByUserId.mockResolvedValue(false);

      await service.seedAdminIfConfigured();

      expect(mockAdminRepository.createForUser).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should do nothing when user exists and is already admin', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'admin.seedEmail') return email;
        if (key === 'admin.seedPassword') return 'password';
        return '';
      });
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockAdminRepository.existsByUserId.mockResolvedValue(true);

      await service.seedAdminIfConfigured();

      expect(mockAdminRepository.createForUser).not.toHaveBeenCalled();
    });

    it('should create User and Admin when user does not exist', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'admin.seedEmail') return email;
        if (key === 'admin.seedPassword') return 'password';
        return '';
      });
      mockUserRepository.findOne.mockResolvedValue(null);
      const createdUser = { ...mockUser, id: userId };
      mockUserRepository.create.mockReturnValue(createdUser as User);
      mockUserRepository.save.mockResolvedValue(createdUser as User);

      await service.seedAdminIfConfigured();

      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ email, passwordHash: 'hashed' }),
      );
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockAdminRepository.createForUser).toHaveBeenCalledWith(userId);
    });
  });
});
