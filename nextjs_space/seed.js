require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const databaseUrl = process.env.DATABASE_URL || 'postgresql://usuario:password123@localhost:5432/2dbffe8ef?schema=public';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

async function seed() {
  try {
    // Crear o actualizar usuario
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.upsert({
      where: { email: 'usuario@example.com' },
      update: {},
      create: {
        email: 'usuario@example.com',
        password: hashedPassword,
        name: 'Usuario Demo',
        emailVerified: new Date(),
      },
    });
    console.log('✅ Usuario:', user.email);

    // Crear usuario adicional
    const hashedPasswordRey = await bcrypt.hash('rey123', 10);
    const userRey = await prisma.user.upsert({
      where: { email: 'rey@rey.com' },
      update: {},
      create: {
        email: 'rey@rey.com',
        password: hashedPasswordRey,
        name: 'Rey',
        emailVerified: new Date(),
      },
    });
    console.log('✅ Usuario:', userRey.email);

    // Eliminar todos los empleados existentes
    const deletedCount = await prisma.employee.deleteMany({});
    console.log(`🗑️  Eliminados ${deletedCount.count} empleados`);

    // Crear empleados
    const employees = [
      { name: 'Braian Nicolas Marti Bobadilla', email: 'braian.martin@grupolrp24.com' },
      { name: 'CAIRO MAGDIEL', email: 'cairo.magdiel@grupolrp24.com' },
      { name: 'Carlos Hernandez', email: 'carlos.hernandez@grupolrp24.com' },
      { name: 'Carlos Lopez Moreno', email: 'carlos.lopez@grupolrp24.com' },
      { name: 'Francisco Troncoso Monges', email: 'francisco.troncoso@grupolrp24.com' },
      { name: 'JULIO Oswaldo', email: 'julio.oswaldo@grupolrp24.com' },
      { name: 'Joel', email: 'joel@grupolrp24.com' },
      { name: 'Jose Manuel Lopez Perez', email: 'jose.lopez@grupolrp24.com' },
      { name: 'Sergio Herrera', email: 'sergio.herrera@grupolrp24.com' },
      { name: 'Mario', email: 'mario@grupolrp24.com' },
    ];

    for (const emp of employees) {
      const employee = await prisma.employee.create({
        data: emp,
      });
      console.log('✅ Empleado creado:', employee.name, `(${employee.email})`);
    }

    console.log('\n🎉 Seed completado exitosamente');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
