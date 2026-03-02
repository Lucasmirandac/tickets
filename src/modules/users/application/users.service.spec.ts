import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../auth/domain/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let mockUserRepository: jest.Mocked<Pick<Repository<User>, 'findOne'>>;

  const userId = '11111111-1111-1111-1111-111111111111';
  const email = 'user@example.com';

  beforeEach(async () => {
    mockUserRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findMe', () => {
    it('should return user with address when user has address fields', async () => {
      const userWithAddress = {
        id: userId,
        email,
        addressStreet: 'Rua A',
        addressNumber: '100',
        addressComplement: null,
        addressNeighborhood: 'Centro',
        addressCity: 'São Paulo',
        addressState: 'SP',
        addressPostalCode: '01234-567',
        addressCountry: 'Brasil',
      };
      mockUserRepository.findOne.mockResolvedValue(userWithAddress as User);

      const actual = await service.findMe(userId, 'user');

      expect(actual.id).toBe(userId);
      expect(actual.email).toBe(email);
      expect(actual.role).toBe('user');
      expect(actual.address).toEqual({
        street: 'Rua A',
        number: '100',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        postalCode: '01234-567',
        country: 'Brasil',
      });
    });

    it('should return address null when user has no address fields', async () => {
      const userWithoutAddress = {
        id: userId,
        email,
        addressStreet: null,
        addressNumber: null,
        addressComplement: null,
        addressNeighborhood: null,
        addressCity: null,
        addressState: null,
        addressPostalCode: null,
        addressCountry: null,
      };
      mockUserRepository.findOne.mockResolvedValue(userWithoutAddress as User);

      const actual = await service.findMe(userId, 'admin');

      expect(actual.address).toBeNull();
      expect(actual.role).toBe('admin');
    });

    it('should return safe default when user is not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const actual = await service.findMe(userId, 'user');

      expect(actual.id).toBe(userId);
      expect(actual.email).toBe('');
      expect(actual.role).toBe('user');
      expect(actual.address).toBeNull();
    });
  });
});
