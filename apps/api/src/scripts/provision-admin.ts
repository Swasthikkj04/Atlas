import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

/**
 * Controlled Provisioning Script for the single Owner-Exclusive Admin Identity.
 */
function assertProvisioningSafety() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (
    nodeEnv === 'production' &&
    !process.env.CONFIRM_PRODUCTION_ADMIN_PROVISION
  ) {
    console.error(
      '⛔ FATAL: Admin provisioning in production requires explicit CONFIRM_PRODUCTION_ADMIN_PROVISION=1 environment flag.',
    );
    process.exit(1);
  }
}

assertProvisioningSafety();

const prisma = new PrismaClient();

async function main() {
  const identifier = process.env.ADMIN_IDENTIFIER || 'platform-owner';
  const password =
    process.env.ADMIN_PASSWORD || 'NebulaAdminSecretPassword2026!';

  console.log('--- NEBULA ADMIN PROVISIONING ---');
  console.log(`Target Identifier: ${identifier}`);

  // Check if admin already exists
  const existing = await prisma.adminIdentity.findFirst();
  let adminId: string;

  if (existing) {
    console.log(`Admin identity already exists with ID: ${existing.id}`);
    adminId = existing.id;
  } else {
    const created = await prisma.adminIdentity.create({
      data: {
        identifier: identifier.trim().toLowerCase(),
        status: 'ACTIVE',
      },
    });
    console.log(`✅ Provisioned owner-exclusive Admin Identity: ${created.id}`);
    adminId = created.id;
  }

  // Create or update credential
  const verifierHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const existingCred = await prisma.adminCredential.findFirst({
    where: { adminId },
  });

  if (existingCred) {
    await prisma.adminCredential.update({
      where: { id: existingCred.id },
      data: {
        verifierHash,
        failedAttempts: 0,
        lockedUntil: null,
        status: 'ACTIVE',
      },
    });
    console.log(`✅ Updated Admin primary password credential.`);
  } else {
    await prisma.adminCredential.create({
      data: {
        adminId,
        verifierHash,
        failedAttempts: 0,
        status: 'ACTIVE',
      },
    });
    console.log(`✅ Created Admin primary password credential.`);
  }

  // Log Genesis / Provision Audit Event
  const eventHash = crypto
    .createHash('sha256')
    .update(
      `0000000000000000000000000000000000000000000000000000000000000000|ADMIN_PROVISIONED|ADMIN_ACTION|${adminId}||||SUCCESS|${new Date().toISOString()}|{}`,
    )
    .digest('hex');

  await prisma.adminAuditEvent.create({
    data: {
      adminId,
      action: 'ADMIN_IDENTITY_PROVISIONED',
      category: 'ADMIN_ACTION',
      retentionClass: 'ADMIN_ACTION',
      outcome: 'SUCCESS',
      previousHash:
        '0000000000000000000000000000000000000000000000000000000000000000',
      eventHash,
      metadata: { provisionMethod: 'CLI_PROVISION_SCRIPT' },
    },
  });

  console.log(`✅ Created Genesis Audit Event in tamper-evident chain.`);
  console.log('\n--- ADMIN PROVISIONING COMPLETE ---');
  console.log(
    'You can now log in at /admin/login using WebAuthn or enroll a passkey.',
  );
}

main()
  .catch((e) => {
    console.error('Error during admin provisioning:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
