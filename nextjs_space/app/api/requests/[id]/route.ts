import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

// Obtener detalles de una solicitud
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const requestData = await prisma.request.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        attachments: true,
      },
    });

    if (!requestData) {
      return NextResponse.json(
        { error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ request: requestData });
  } catch (error) {
    console.error("Error obteniendo solicitud:", error);
    return NextResponse.json(
      { error: "Error al obtener la solicitud" },
      { status: 500 }
    );
  }
}
