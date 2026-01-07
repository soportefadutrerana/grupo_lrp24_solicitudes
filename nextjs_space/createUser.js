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

async function createUser() {
  try {
    // Datos del usuario
    const email = 'usuario@example.com';
    const password = 'password123';
    const name = 'Usuario Demo';

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        name: name,
        emailVerified: new Date(),
      },
    });

    console.log('✅ Usuario creado exitosamente:');
    console.log('Email:', user.email);
    console.log('Nombre:', user.name);
    console.log('\nCredenciales de login:');
    console.log('Email:', email);
    console.log('Contraseña:', password);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
