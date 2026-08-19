import { describe, it, expect } from 'vitest';
import { can, canAny, canAccessPortal, roleLabel } from '../lib/permissions';
import type { UserResponseDTO } from '../dtos';

const user = (permissions: string[] = [], role = 'SALES_EXECUTIVE'): UserResponseDTO => ({
  id: 'u1', email: 'x@y.com', displayName: 'X', photoURL: '',
  role, permissions: permissions as UserResponseDTO['permissions'],
});

/**
 * These decide what the interface offers. The server re-checks everything, so a mistake here
 * shows the wrong menu rather than opening a hole — but a counsellor seeing a Team tab they
 * cannot use, or an admin missing one they need, is still a broken product.
 */
describe('permission helpers', () => {
  it('treats a missing permission list as no access, never as full access', () => {
    expect(can(undefined, 'LEAD_EDIT')).toBe(false);
    expect(can(null, 'LEAD_EDIT')).toBe(false);
    expect(can({ ...user(), permissions: undefined }, 'LEAD_EDIT')).toBe(false);
    expect(canAccessPortal(undefined)).toBe(false);
  });

  it('keeps someone with no permissions out of the portal entirely', () => {
    expect(canAccessPortal(user([]))).toBe(false);
    expect(canAccessPortal(user(['LEAD_VIEW_OWN']))).toBe(true);
  });

  it('does not confuse one permission for another', () => {
    const viewer = user(['LEAD_VIEW_ALL', 'REPORT_VIEW'], 'VIEWER');
    expect(can(viewer, 'LEAD_VIEW_ALL')).toBe(true);
    expect(can(viewer, 'LEAD_EDIT')).toBe(false);
    expect(can(viewer, 'USER_MANAGE')).toBe(false);
  });

  it('canAny needs only one of the listed permissions', () => {
    const c = user(['LEAD_VIEW_OWN']);
    expect(canAny(c, 'LEAD_VIEW_ALL', 'LEAD_VIEW_OWN')).toBe(true);
    expect(canAny(c, 'LEAD_VIEW_ALL', 'USER_MANAGE')).toBe(false);
  });

  it('falls back to a readable role name rather than showing a raw enum', () => {
    expect(roleLabel({ ...user(), roleLabel: 'Counsellor' })).toBe('Counsellor');
    expect(roleLabel(user([], 'SALES_EXECUTIVE'))).toBe('sales executive');
    expect(roleLabel(null)).toBe('Signed out');
  });
});
