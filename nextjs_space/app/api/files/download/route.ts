import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getFileUrl } from "@/lib/s3";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cloud_storage_path = searchParams.get("path");
    const isPublic = searchParams.get("isPublic") === "true";

    if (!cloud_storage_path) {
      return NextResponse.json(
        { error: "Path es requerido" },
        { status: 400 }
      );
    }

    const fileUrl = await getFileUrl(cloud_storage_path, isPublic);

    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error("Error obteniendo URL del archivo:", error);
    return NextResponse.json(
      { error: "Error al obtener URL del archivo" },
      { status: 500 }
    );
  }
}
