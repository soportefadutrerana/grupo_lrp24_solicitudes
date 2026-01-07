import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

// Obtener todos los empleados
export async function GET(request: Request) {
  try {
    // Obtener empleados reales de la base de datos
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(employees, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo empleados:", error);
    return NextResponse.json(
      { error: "Error al obtener los empleados" },
      { status: 500 }
    );
  }
}
