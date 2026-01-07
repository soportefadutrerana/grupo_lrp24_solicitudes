import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { generatePresignedUploadUrl } from "@/lib/s3";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { fileName, contentType, isPublic } = await request.json();

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: "fileName y contentType son requeridos" },
        { status: 400 }
      );
    }

    const { uploadUrl, cloud_storage_path } = await generatePresignedUploadUrl(
      fileName,
      contentType,
      isPublic ?? true
    );

    return NextResponse.json({ uploadUrl, cloud_storage_path });
  } catch (error) {
    console.error("Error generando URL presignada:", error);
    return NextResponse.json(
      { error: "Error al generar URL de subida" },
      { status: 500 }
    );
  }
}
