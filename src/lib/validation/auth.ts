import { z } from 'zod'

/**
 * Auth-form schemas. Server-side parsing layer for the NextAuth
 * credentials provider and the staff-invite password-set form.
 */

export const loginInput = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(256),
})
export type LoginInput = z.infer<typeof loginInput>
