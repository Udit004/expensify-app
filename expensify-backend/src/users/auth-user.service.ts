import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ClerkClaims {
  sub: string;
  email?: string;
  name?: string;
}

@Injectable()
export class AuthUserService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateByClerk(claims: ClerkClaims): Promise<{ id: string }> {
    const { sub, email, name } = claims;
    const byClerk = await this.prisma.user.findFirst({
      where: { clerkUserId: sub } as any,
      select: { id: true },
    });
    if (byClerk) return byClerk;

    if (email) {
      const byEmail = await this.prisma.user.findFirst({
        where: { email } as any,
        select: { id: true },
      });
      if (byEmail) {
        await this.prisma.user.update({
          where: { id: byEmail.id },
          data: { clerkUserId: sub } as any,
        });
        return byEmail;
      }
    }
    const created = await this.prisma.user.create({
      data: {
        clerkUserId: sub,
        email: email || `${sub}@example.com`,
        name: name || 'Unknown',
        password: '',
      },
      select: { id: true },
    } as any);
    return created;
  }
}

export function parseClerkAuthHeader(authorization?: string): ClerkClaims | null {
  if (!authorization) return null;
  const parts = authorization.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  const token = parts[1];
  const segments = token.split('.');
  if (segments.length < 2) return null;
  try {
    const payload = JSON.parse(Buffer.from(segments[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    return { sub: payload.sub, email: payload.email, name: payload.name } as ClerkClaims;
  } catch {
    return null;
  }
}


