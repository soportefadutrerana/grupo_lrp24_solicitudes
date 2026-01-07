import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Array de usuarios a crear
  const users = [
    {
      email: 'john@doe.com',
      password: 'johndoe123',
      name: 'John Doe'
    },
    {
      email: 'clara@grupolrp24.com',
      password: 'Clara2024!',
      name: 'Clara'
    },
    {
      email: 'sara@grupolrp24.com',
      password: 'Sara2024!',
      name: 'Sara'
    },
    {
      email: 'miing@grupolrp24.com',
      password: 'Miing2024!',
      name: 'Miing'
    }
  ];

  // Crear usuarios
  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      console.log(`Usuario ${userData.email} ya existe, actualizando...`);
      await prisma.user.update({
        where: { email: userData.email },
        data: {
          password: hashedPassword,
          name: userData.name
        }
      });
    } else {
      console.log(`Creando usuario ${userData.email}...`);
      await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name
        }
      });
    }
  }

  console.log('Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
