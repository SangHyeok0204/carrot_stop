import { UserRole } from '@/types';

export const ROLES = {
  ADVERTISER: 'advertiser' as UserRole,
  INFLUENCER: 'influencer' as UserRole,
  ADMIN: 'admin' as UserRole,
} as const;

export function isAdvertiser(role: UserRole): boolean {
  return role === ROLES.ADVERTISER;
}

export function isInfluencer(role: UserRole): boolean {
  return role === ROLES.INFLUENCER;
}

export function isAdmin(role: UserRole): boolean {
  return role === ROLES.ADMIN;
}

