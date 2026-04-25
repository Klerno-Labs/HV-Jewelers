import type { DefaultSession, NextAuthConfig } from 'next-auth'

export type UserRole = 'CUSTOMER' | 'STAFF' | 'ADMIN'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: UserRole
    } & DefaultSession['user']
  }

  interface User {
    role?: UserRole
  }
}

/**
 * Edge-safe Auth.js configuration. Imported by middleware so it must not
 * reference Node-only modules (Prisma, bcrypt, etc.). Full provider wiring
 * lives in `auth.ts` and is loaded by Node-runtime routes only.
 */
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  providers: [], // wired in src/auth.ts
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role ?? 'CUSTOMER'
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? session.user.id
        const role = (token.role as UserRole | undefined) ?? 'CUSTOMER'
        session.user.role = role
      }
      return session
    },
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-hv.session-token'
          : 'hv.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
} satisfies NextAuthConfig
