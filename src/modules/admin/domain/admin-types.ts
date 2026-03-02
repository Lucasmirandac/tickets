/**
 * Admin role types. Used for authorization and stored in Admin entity.
 * - super_admin: full access (create events, validate tickets, create admins)
 * - event_manager: create/update events, sessions, seats
 * - ticket_validator: validate ticket QR codes at entrance
 */
export const ADMIN_TYPES = ['super_admin', 'event_manager', 'ticket_validator'] as const;
export type AdminType = (typeof ADMIN_TYPES)[number];

export const ADMIN_ROLE_SUPER_ADMIN: AdminType = 'super_admin';
export const ADMIN_ROLE_EVENT_MANAGER: AdminType = 'event_manager';
export const ADMIN_ROLE_TICKET_VALIDATOR: AdminType = 'ticket_validator';
