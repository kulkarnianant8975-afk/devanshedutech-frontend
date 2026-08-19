import { PermissionName, UserResponseDTO } from '../dtos';

/**
 * Permission helpers for rendering decisions.
 *
 * These answer "should I draw this control?" — never "is this allowed?". The server owns
 * authorisation and re-checks every request, so a bug here shows the wrong menu, it does not
 * open a hole. Treat a missing permission list as no access rather than as full access.
 */

export const permissionsOf = (user?: UserResponseDTO | null): PermissionName[] =>
  user?.permissions ?? [];

export const can = (user: UserResponseDTO | null | undefined, permission: PermissionName): boolean =>
  permissionsOf(user).includes(permission);

export const canAny = (user: UserResponseDTO | null | undefined, ...permissions: PermissionName[]): boolean =>
  permissions.some(p => can(user, p));

/**
 * Whether this person belongs in the staff portal at all. Anyone holding no permission is a
 * public sign-up, not a colleague, and sees the "no access" screen rather than an empty portal.
 */
export const canAccessPortal = (user?: UserResponseDTO | null): boolean =>
  permissionsOf(user).length > 0;

/** Friendly role name, falling back to the raw value if the server sent an unknown one. */
export const roleLabel = (user?: UserResponseDTO | null): string => {
  if (!user) return 'Signed out';
  if (user.roleLabel) return user.roleLabel;
  return (user.role ?? 'NONE').replace(/_/g, ' ').toLowerCase();
};
