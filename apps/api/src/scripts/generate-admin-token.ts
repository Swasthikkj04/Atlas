import { PrismaClient } from '@prisma/client';
import { AdminJwtCryptoService } from '../modules/admin-session/services/admin-jwt-crypto.service';

/**
 * DEVELOPMENT ONLY SCRIPT
 *
 * Hardened to prevent accidental or unauthorized execution against production environments.
 */
function assertDevelopmentEnvironment() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const dbUrl = process.env.DATABASE_URL || '';
  const allowDevToken = process.env.ALLOW_DEV_ADMIN_TOKEN;

  if (nodeEnv === 'production') {
    console.error(
      '⛔ FATAL SECURITY ERROR: `generate-admin-token` cannot be executed in production environment (NODE_ENV=production).',
    );
    process.exit(1);
  }

  const productionDbPatterns = [
    /rds\.amazonaws\.com/i,
    /postgres\.database\.azure\.com/i,
    /storage\.googleapis\.com/i,
    /neon\.tech/i,
    /supabase\.co/i,
    /cockroachlabs\.cloud/i,
    /prod/i,
  ];

  for (const pattern of productionDbPatterns) {
    if (pattern.test(dbUrl)) {
      console.error(
        `⛔ FATAL SECURITY ERROR: Refusing to generate dev token against suspected production database URL: [${dbUrl.replace(/:[^:@]+@/, ':***@')}].`,
      );
      process.exit(1);
    }
  }
}

assertDevelopmentEnvironment();

const prisma = new PrismaClient();
const jwtCrypto = new AdminJwtCryptoService();

async function main() {
  const admin = await prisma.adminIdentity.findFirst();
  if (!admin) {
    console.error(
      '❌ No Admin Identity found! Run `pnpm --filter api run provision:admin` first.',
    );
    process.exit(1);
  }

  // Create an active AdminSession
  const session = await prisma.adminSession.create({
    data: {
      adminId: admin.id,
      assuranceLevel: 'AAL3',
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h for dev
    },
  });

  const { accessToken } = jwtCrypto.signAdminToken({
    adminIdentityId: admin.id,
    sessionId: session.id,
    identifier: admin.identifier,
    assuranceLevel: 'AAL3',
  });

  console.log('\n======================================================');
  console.log('⚠️  DEVELOPMENT ONLY: NEBULA ADMIN ACCESS TOKEN');
  console.log('======================================================');
  console.log(`Admin ID:    ${admin.id}`);
  console.log(`Identifier:  ${admin.identifier}`);
  console.log(`Session ID:  ${session.id}`);
  console.log(`Token:`);
  console.log(`\n${accessToken}\n`);
  console.log('======================================================');
  console.log('HOW TO ACCESS THE ADMIN CONSOLE:');
  console.log('1. Open your browser to: http://localhost:5173/admin/login');
  console.log('   OR directly to: http://localhost:5173/admin');
  console.log('2. In DevTools Console (F12), run:');
  console.log(
    `   sessionStorage.setItem('admin_access_token', '${accessToken}');`,
  );
  console.log('3. Refresh the page to enter the live Admin Console.');
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
