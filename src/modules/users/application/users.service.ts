import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../auth/domain/user.entity';

export interface UserMeResponse {
  id: string;
  email: string;
  role: string;
  address: {
    street: string | null;
    number: string | null;
    complement: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
  } | null;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findMe(userId: string, role: string): Promise<UserMeResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'email',
        'addressStreet',
        'addressNumber',
        'addressComplement',
        'addressNeighborhood',
        'addressCity',
        'addressState',
        'addressPostalCode',
        'addressCountry',
      ],
    });
    if (!user) {
      return { id: userId, email: '', role, address: null };
    }
    const hasAddress =
      user.addressStreet != null ||
      user.addressNumber != null ||
      user.addressCity != null ||
      user.addressPostalCode != null;
    return {
      id: user.id,
      email: user.email,
      role,
      address: hasAddress
        ? {
            street: user.addressStreet ?? null,
            number: user.addressNumber ?? null,
            complement: user.addressComplement ?? null,
            neighborhood: user.addressNeighborhood ?? null,
            city: user.addressCity ?? null,
            state: user.addressState ?? null,
            postalCode: user.addressPostalCode ?? null,
            country: user.addressCountry ?? null,
          }
        : null,
    };
  }
}
