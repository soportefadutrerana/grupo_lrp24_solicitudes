require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const databaseUrl = process.env.DATABASE_URL || 'postgresql://usuario:password123@localhost:5432/2dbffe8ef?schema=public';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

async function cleanupSessions() {
  try {
    console.log('📋 Verificando usuarios...');
    const users = await prisma.user.findMany({
      include: { sessions: true },
    });
    console.log(`✅ Encontrados ${users.length} usuarios`);
    users.forEach(u => {
      console.log(`   - ${u.email} (${u.id}) - ${u.sessions.length} sesiones`);
    });

    console.log('\n🗑️  Limpiando todas las sesiones...');
    const deletedSessions = await prisma.session.deleteMany({});
    console.log(`✅ ${deletedSessions.count} sesiones eliminadas`);

    console.log('\n✅ Limpieza completada. Por favor, haz logout y login de nuevo.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupSessions();
