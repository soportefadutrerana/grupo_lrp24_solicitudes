import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

// Crear nueva solicitud
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { type, reference, date, description, destinatarioId, attachments } = data;

    console.log("📨 Datos recibidos:", { type, reference, date, description, destinatarioId });

    if (!type || !reference || !date || !description) {
      console.log("❌ Campos faltantes - type:", type, "reference:", reference, "date:", date, "description:", description);
      return NextResponse.json(
        { error: "Todos los campos son requeridos (type, reference, date, description)" },
        { status: 400 }
      );
    }

    // Validar que el destinatarioId existe si fue proporcionado
    if (destinatarioId) {
      console.log("🔍 Validando destinatarioId:", destinatarioId);
      const employee = await prisma.employee.findUnique({
        where: { id: destinatarioId },
      });
      if (!employee) {
        console.log("❌ Empleado no encontrado con ID:", destinatarioId);
        return NextResponse.json(
          { error: "El empleado destinatario no existe" },
          { status: 400 }
        );
      }
      console.log("✅ Empleado encontrado:", employee.name);
    }

    // Crear la solicitud
    const newRequest = await prisma.request.create({
      data: {
        type,
        reference,
        date: new Date(date),
        description,
        destinatarioId: destinatarioId || null,
        status: "Pendiente",
        userId: (session.user as any).id,
      },
      include: {
        user: true,
        destinatario: true,
      },
    });

    // Crear los attachments si existen
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      await prisma.attachment.createMany({
        data: attachments.map((att: any) => ({
          fileName: att.fileName,
          cloud_storage_path: att.cloud_storage_path,
          isPublic: att.isPublic ?? true,
          requestId: newRequest.id,
        })),
      });
    }

    // Enviar email de notificación
    try {
      const appUrl = process.env.NEXTAUTH_URL || '';
      const appName = appUrl ? new URL(appUrl).hostname.split('.')?.[0] ?? 'Grupo LRP 24' : 'Grupo LRP 24';

      const htmlBody = `
        <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #000000; color: #D4AF37; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #D4AF37; font-size: 28px; margin: 0; font-weight: bold; letter-spacing: 2px;">GRUPO LRP 24</h1>
            <div style="height: 2px; background: linear-gradient(90deg, transparent, #D4AF37, transparent); margin: 10px 0;"></div>
          </div>
          
          <h2 style="color: #D4AF37; border-bottom: 2px solid #D4AF37; padding-bottom: 10px; font-size: 22px;">
            Nueva Solicitud de Documentación
          </h2>
          
          <div style="background: #1a1a1a; padding: 25px; border-radius: 8px; margin: 20px 0; border: 1px solid #D4AF37;">
            <p style="margin: 12px 0; font-size: 16px;"><strong style="color: #D4AF37;">Usuario:</strong> <span style="color: #ffffff;">${newRequest.user?.name || 'N/A'}</span></p>
            <p style="margin: 12px 0; font-size: 16px;"><strong style="color: #D4AF37;">Email:</strong> <span style="color: #ffffff;">${newRequest.user?.email || 'N/A'}</span></p>
            <p style="margin: 12px 0; font-size: 16px;"><strong style="color: #D4AF37;">Tipo de Documento:</strong> <span style="color: #ffffff;">${type}</span></p>
            <p style="margin: 12px 0; font-size: 16px;"><strong style="color: #D4AF37;">Número de Referencia:</strong> <span style="color: #ffffff;">${reference}</span></p>
            <p style="margin: 12px 0; font-size: 16px;"><strong style="color: #D4AF37;">Fecha:</strong> <span style="color: #ffffff;">${new Date(date).toLocaleDateString('es-ES')}</span></p>
            <p style="margin: 12px 0; font-size: 16px;"><strong style="color: #D4AF37;">Estado:</strong> <span style="background: #D4AF37; color: #000000; padding: 4px 12px; border-radius: 4px; font-weight: bold;">Pendiente</span></p>
            
            <div style="margin-top: 20px;">
              <p style="margin: 8px 0; font-size: 16px; color: #D4AF37; font-weight: bold;">Descripción:</p>
              <div style="background: #000000; padding: 15px; border-radius: 4px; border-left: 4px solid #D4AF37; color: #ffffff; font-size: 15px; line-height: 1.6;">
                ${description}
              </div>
            </div>
            
            ${attachments && attachments.length > 0 ? `
              <div style="margin-top: 20px;">
                <p style="margin: 8px 0; font-size: 16px; color: #D4AF37; font-weight: bold;">Archivos Adjuntos: ${attachments.length}</p>
                <ul style="color: #ffffff; font-size: 14px; margin: 10px 0; padding-left: 20px;">
                  ${attachments.map((att: any) => `<li style="margin: 5px 0;">${att.fileName}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
          
          <p style="color: #888888; font-size: 13px; margin-top: 30px; text-align: center; border-top: 1px solid #333333; padding-top: 20px;">
            Solicitud recibida el ${new Date().toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}
          </p>
        </div>
      `;

      await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deployment_token: process.env.ABACUSAI_API_KEY,
          subject: `Nueva Solicitud de Documentación - ${type} (Ref: ${reference})`,
          body: htmlBody,
          is_html: true,
          recipient_email: 'contabilidadutrerana@gmail.com',
          sender_email: `noreply@${appUrl ? new URL(appUrl).hostname : 'grupolrp24.com'}`,
          sender_alias: appName,
        }),
      });
    } catch (emailError) {
      console.error('Error enviando email:', emailError);
      // No fallar la solicitud si el email falla
    }

    return NextResponse.json(
      { message: "Solicitud creada exitosamente", request: newRequest },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creando solicitud:", error);
    return NextResponse.json(
      { error: "Error al crear la solicitud" },
      { status: 500 }
    );
  }
}

// Obtener todas las solicitudes
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
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");

    const where: any = {};

    if (type && type !== "todos") {
      where.type = type;
    }

    if (status && status !== "todos") {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    const requests = await prisma.request.findMany({
      where,
      include: {
        user: true,
        attachments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Error obteniendo solicitudes:", error);
    return NextResponse.json(
      { error: "Error al obtener las solicitudes" },
      { status: 500 }
    );
  }
}
