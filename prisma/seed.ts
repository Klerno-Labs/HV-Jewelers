import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

/**
 * Development seed. Idempotent — uses upsert on email so you can run
 * it repeatedly without piling on duplicates. Not for production data.
 *
 * Post-catalog-retirement (commit c8adbff): seeds only the auth users
 * needed to sign into /admin. The Shopify-backed catalog is owned by
 * Shopify admin, not by this database.
 *
 * Usage: `npx prisma db seed` (configured in package.json under "prisma").
 */

const prisma = new PrismaClient()

async function main() {
  console.log('▸ Seeding HV Jewelers dev users')

  // Test passwords. NEVER use these in production. Override via
  // SEED_ADMIN_PASSWORD / SEED_STAFF_PASSWORD env vars when seeding a
  // shared environment.
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'hv-admin-dev-pass'
  const staffPassword = process.env.SEED_STAFF_PASSWORD ?? 'hv-staff-dev-pass'

  const [adminHash, staffHash] = await Promise.all([
    bcrypt.hash(adminPassword, 12),
    bcrypt.hash(staffPassword, 12),
  ])

  await prisma.user.upsert({
    where: { email: 'admin@hvjewelers.test' },
    update: { role: 'ADMIN', passwordHash: adminHash, isDisabled: false },
    create: {
      email: 'admin@hvjewelers.test',
      name: 'HV Admin',
      role: 'ADMIN',
      passwordHash: adminHash,
    },
  })

  await prisma.user.upsert({
    where: { email: 'staff@hvjewelers.test' },
    update: { role: 'STAFF', passwordHash: staffHash, isDisabled: false },
    create: {
      email: 'staff@hvjewelers.test',
      name: 'HV Staff',
      role: 'STAFF',
      passwordHash: staffHash,
    },
  })

  console.log('  · Test users seeded (admin / staff @hvjewelers.test)')
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log('  · Admin password (dev default):', adminPassword)
    console.log('  · Staff password (dev default):', staffPassword)
  }

  console.log('✓ Seed complete')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
