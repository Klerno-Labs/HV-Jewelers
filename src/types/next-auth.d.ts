// Augmentations are declared in src/auth.config.ts so they co-locate with the
// Auth.js configuration and are guaranteed to load wherever auth.config is
// imported. This file re-exports the UserRole type for convenience.

export type { UserRole } from '@/auth.config'
