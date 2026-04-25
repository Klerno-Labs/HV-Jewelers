import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { authConfig } from './auth.config'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth/passwords'
import { audit } from '@/lib/auth/audit'
import { loginInput } from '@/lib/validation/auth'

/**
 * Auth.js v5 setup. Node-runtime only — never imported from middleware.
 *
 * Credentials provider:
 *   1. Validates input shape with Zod.
 *   2. Looks up the user by email (case-insensitive — email is stored
 *      lowercased on write).
 *   3. Always runs a bcrypt compare (real hash if found, decoy if not)
 *      so response time does not reveal whether an email is registered.
 *   4. Writes an audit log row for every attempt — success and failure.
 *   5. Refuses to authenticate disabled users.
 *
 * The function returns either a minimal user object or null. Auth.js
 * converts a null return into a generic CredentialsSignin error so the
 * UI never gets a leak channel like "no such user".
 */

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        // Pull request metadata for audit context.
        const ip = pickHeader(request, 'x-forwarded-for')?.split(',')[0]?.trim()
          ?? pickHeader(request, 'x-real-ip')
          ?? null
        const userAgent = pickHeader(request, 'user-agent') ?? null

        const parsed = loginInput.safeParse(credentials)
        if (!parsed.success) {
          await audit({
            actorId: null,
            action: 'auth.signin.failure',
            resourceType: 'User',
            ip,
            userAgent,
            context: { reason: 'invalid_input' },
          })
          return null
        }
        const { email, password } = parsed.data

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isDisabled: true,
            passwordHash: true,
          },
        })

        const ok = await verifyPassword(password, user?.passwordHash)

        if (!user) {
          await audit({
            actorId: null,
            action: 'auth.signin.failure',
            resourceType: 'User',
            ip,
            userAgent,
            context: { reason: 'no_user', email },
          })
          return null
        }

        if (user.isDisabled) {
          await audit({
            actorId: null,
            action: 'auth.signin.failure',
            resourceType: 'User',
            resourceId: user.id,
            ip,
            userAgent,
            context: { reason: 'disabled', email },
          })
          return null
        }

        if (!user.passwordHash) {
          await audit({
            actorId: null,
            action: 'auth.signin.failure',
            resourceType: 'User',
            resourceId: user.id,
            ip,
            userAgent,
            context: { reason: 'no_password', email },
          })
          return null
        }

        if (!ok) {
          await audit({
            actorId: null,
            action: 'auth.signin.failure',
            resourceType: 'User',
            resourceId: user.id,
            ip,
            userAgent,
            context: { reason: 'wrong_password', email },
          })
          return null
        }

        // Successful sign-in: stamp lastSignInAt + emit audit row.
        await prisma.user.update({
          where: { id: user.id },
          data: { lastSignInAt: new Date() },
        })
        await audit({
          actorId: user.id,
          action: 'auth.signin.success',
          resourceType: 'User',
          resourceId: user.id,
          ip,
          userAgent,
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: user.role,
        }
      },
    }),
  ],
})

function pickHeader(request: Request | undefined, name: string): string | null {
  if (!request) return null
  return request.headers.get(name)
}
