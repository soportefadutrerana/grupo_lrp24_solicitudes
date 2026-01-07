import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

// Actualizar el estado de una solicitud
export async function PATCH(
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

    const { status } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: "El estado es requerido" },
        { status: 400 }
      );
    }

    const updatedRequest = await prisma.request.update({
      where: { id: params.id },
      data: { status },
      include: {
        user: true,
        attachments: true,
      },
    });

    return NextResponse.json(
      { message: "Estado actualizado exitosamente", request: updatedRequest },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error actualizando estado:", error);
    return NextResponse.json(
      { error: "Error al actualizar el estado" },
      { status: 500 }
    );
  }
}
