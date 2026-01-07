"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import Image from "next/image";

interface FileUpload {
  file: File;
  preview?: string;
  cloud_storage_path?: string;
  uploading: boolean;
  uploaded: boolean;
}

export default function DashboardPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [type, setType] = useState("");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles: FileUpload[] = selectedFiles.map((file) => ({
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      uploading: false,
      uploaded: false,
    }));
    setFiles([...files, ...newFiles]);
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    if (newFiles?.[index]?.preview) {
      URL.revokeObjectURL(newFiles[index].preview!);
    }
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const uploadFile = async (fileUpload: FileUpload, index: number): Promise<string | null> => {
    try {
      const newFiles = [...files];
      newFiles[index] = { ...newFiles?.[index], uploading: true } as FileUpload;
      setFiles(newFiles);

      // Obtener URL presignada
      const presignedRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: fileUpload.file.name,
          contentType: fileUpload.file.type,
          isPublic: true,
        }),
      });

      if (!presignedRes.ok) throw new Error("Error obteniendo URL de subida");

      const { uploadUrl, cloud_storage_path } = await presignedRes.json();

      // Subir archivo a S3
      const uploadHeaders: HeadersInit = {
        "Content-Type": fileUpload.file.type,
      };

      // Verificar si la URL requiere Content-Disposition header
      const urlObj = new URL(uploadUrl);
      const signedHeaders = urlObj.searchParams.get("X-Amz-SignedHeaders");
      if (signedHeaders?.includes("content-disposition")) {
        uploadHeaders["Content-Disposition"] = "attachment";
      }

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: uploadHeaders,
        body: fileUpload.file,
      });

      if (!uploadRes.ok) throw new Error("Error subiendo archivo");

      const updatedFiles = [...files];
      updatedFiles[index] = {
        ...updatedFiles?.[index],
        cloud_storage_path,
        uploading: false,
        uploaded: true,
      } as FileUpload;
      setFiles(updatedFiles);

      return cloud_storage_path;
    } catch (error) {
      console.error("Error subiendo archivo:", error);
      const updatedFiles = [...files];
      updatedFiles[index] = { ...updatedFiles?.[index], uploading: false, uploaded: false } as FileUpload;
      setFiles(updatedFiles);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Subir todos los archivos primero
      const uploadPromises = files.map((fileUpload, index) => {
        if (!fileUpload.uploaded && !fileUpload.uploading) {
          return uploadFile(fileUpload, index);
        }
        return Promise.resolve(fileUpload.cloud_storage_path || null);
      });

      const uploadedPaths = await Promise.all(uploadPromises);
      const attachments = uploadedPaths
        .filter((path): path is string => path !== null)
        .map((cloud_storage_path, index) => ({
          fileName: files?.[index]?.file?.name || "",
          cloud_storage_path,
          isPublic: true,
        }));

      // Crear la solicitud
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          reference,
          date,
          description,
          attachments,
        }),
      });

      if (!response.ok) throw new Error("Error al crear la solicitud");

      setSuccess(true);
      // Limpiar formulario
      setType("");
      setReference("");
      setDate("");
      setDescription("");
      setFiles([]);

      setTimeout(() => {
        setSuccess(false);
        router.push("/admin");
      }, 2000);
    } catch (error) {
      console.error("Error:", error);
      setError("Ocurrió un error al enviar la solicitud. Por favor, inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-12 animate-fade-in">
        <div className="text-center mb-12">
          <div className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-[#D4AF37] shadow-gold-lg">
            <Image
              src="https://cdn.abacus.ai/images/777878e0-18b8-4d6e-8a78-2f537ba780c5.png"
              alt="Grupo LRP 24 Logo"
              fill
              className="object-cover"
            />
          </div>
          <h1 className="text-4xl font-bold text-gradient mb-3 font-serif">Nueva Solicitud de Documentación</h1>
          <p className="text-gray-400 text-lg font-serif">Complete el formulario para solicitar la documentación necesaria</p>
        </div>

        {success && (
          <Card className="mb-8 bg-green-900/20 border-green-600 animate-slide-in">
            <CardContent className="flex items-center space-x-3 p-4">
              <CheckCircle className="h-6 w-6 text-green-400" />
              <div>
                <p className="font-semibold text-green-400 font-serif">Solicitud enviada exitosamente</p>
                <p className="text-sm text-green-300 font-serif">Redirigiendo al panel de administración...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="mb-8 bg-red-900/20 border-red-600 animate-slide-in">
            <CardContent className="flex items-center space-x-3 p-4">
              <AlertCircle className="h-6 w-6 text-red-400" />
              <p className="text-red-400 font-serif">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-gold-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-6 w-6" />
              <span>Información de la Solicitud</span>
            </CardTitle>
            <CardDescription>Todos los campos son obligatorios</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Documento *</Label>
                  <Select
                    id="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    required
                    disabled={loading}
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="Factura">Factura</option>
                    <option value="Albarán">Albarán</option>
                    <option value="Nota de entrega">Nota de entrega</option>
                    <option value="Contrato">Contrato</option>
                    <option value="Otros">Otros</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference">Número de Pedido/Referencia *</Label>
                  <Input
                    id="reference"
                    type="text"
                    placeholder="Ej: PED-2024-001"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Fecha *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción Detallada *</Label>
                <Textarea
                  id="description"
                  placeholder="Describa la documentación que necesita y cualquier detalle relevante..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  disabled={loading}
                  rows={5}
                />
              </div>

              <div className="space-y-4">
                <Label>Archivos Adjuntos</Label>
                <div className="border-2 border-dashed border-[#333333] rounded-lg p-8 text-center hover:border-[#D4AF37] transition-all duration-300">
                  <Upload className="mx-auto h-12 w-12 text-[#D4AF37] mb-4" />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-[#D4AF37] font-semibold font-serif hover:text-[#F4D03F] transition-colors">
                      Seleccionar archivos
                    </span>
                    <span className="text-gray-400 ml-2 font-serif">o arrastra y suelta</span>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={loading}
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-2 font-serif">PDF, Word, Excel, Imágenes (máx. 10MB por archivo)</p>
                </div>

                {files.length > 0 && (
                  <div className="space-y-3 mt-4">
                    {files.map((fileUpload, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg border border-[#333333] hover:border-[#D4AF37] transition-all duration-300"
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          {fileUpload?.preview ? (
                            <div className="relative w-12 h-12 rounded overflow-hidden">
                              <Image
                                src={fileUpload.preview}
                                alt={fileUpload.file?.name || "Preview"}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <FileText className="h-12 w-12 text-[#D4AF37]" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate font-serif">
                              {fileUpload.file?.name}
                            </p>
                            <p className="text-xs text-gray-400 font-serif">
                              {(fileUpload.file?.size / 1024 / 1024)?.toFixed(2) || 0} MB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {fileUpload.uploading && (
                            <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" />
                          )}
                          {fileUpload.uploaded && (
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          )}
                          {!loading && (
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t-2 border-[#333333]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin")}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" size="lg" disabled={loading} className="min-w-[200px]">
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Enviando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Enviar Solicitud
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
