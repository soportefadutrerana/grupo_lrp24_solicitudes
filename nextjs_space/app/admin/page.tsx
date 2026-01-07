"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  LayoutDashboard,
  Filter,
  Download,
  FileText,
  Calendar,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Image from "next/image";

interface Request {
  id: string;
  type: string;
  reference: string;
  date: string;
  description: string;
  status: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  attachments: Array<{
    id: string;
    fileName: string;
    cloud_storage_path: string;
    isPublic: boolean;
  }>;
}

export default function AdminPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchRequests();
    }
  }, [status]);

  useEffect(() => {
    filterRequests();
  }, [requests, typeFilter, statusFilter]);

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/requests");
      if (!response.ok) throw new Error("Error fetching requests");
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    if (typeFilter !== "todos") {
      filtered = filtered.filter((req) => req?.type === typeFilter);
    }

    if (statusFilter !== "todos") {
      filtered = filtered.filter((req) => req?.status === statusFilter);
    }

    setFilteredRequests(filtered);
  };

  const updateStatus = async (requestId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/requests/${requestId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Error updating status");

      await fetchRequests();
      if (selectedRequest?.id === requestId) {
        const updatedRequest = requests.find((r) => r?.id === requestId);
        if (updatedRequest) {
          setSelectedRequest({ ...updatedRequest, status: newStatus });
        }
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const downloadFile = async (cloud_storage_path: string, fileName: string, isPublic: boolean) => {
    try {
      const response = await fetch(
        `/api/files/download?path=${encodeURIComponent(cloud_storage_path)}&isPublic=${isPublic}`
      );
      if (!response.ok) throw new Error("Error obteniendo URL del archivo");

      const { url } = await response.json();

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error descargando archivo:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: any }> = {
      Pendiente: { bg: "bg-yellow-900/30", text: "text-yellow-400", icon: Clock },
      "En proceso": { bg: "bg-blue-900/30", text: "text-blue-400", icon: AlertCircle },
      Completada: { bg: "bg-green-900/30", text: "text-green-400", icon: CheckCircle },
    };

    const style = styles?.[status] || styles["Pendiente"];
    const Icon = style.icon;

    return (
      <span
        className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-semibold font-serif ${style.bg} ${style.text}`}
      >
        <Icon className="h-4 w-4" />
        <span>{status}</span>
      </span>
    );
  };

  if (status === "loading" || loading) {
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

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-12 animate-fade-in">
        <div className="text-center mb-12">
          <div className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-[#D4AF37] shadow-gold-lg">
            <Image
              src="https://cdn.abacus.ai/images/777878e0-18b8-4d6e-8a78-2f537ba780c5.png"
              alt="Grupo LRP 24 Logo"
              fill
              className="object-cover"
            />
          </div>
          <h1 className="text-4xl font-bold text-gradient mb-3 font-serif">Panel de Administración</h1>
          <p className="text-gray-400 text-lg font-serif">Gestiona todas las solicitudes de documentación</p>
        </div>

        {/* Filtros */}
        <Card className="mb-8 shadow-gold">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filtros</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="type-filter">Tipo de Documento</Label>
                <Select
                  id="type-filter"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="todos">Todos</option>
                  <option value="Factura">Factura</option>
                  <option value="Albarán">Albarán</option>
                  <option value="Nota de entrega">Nota de entrega</option>
                  <option value="Contrato">Contrato</option>
                  <option value="Otros">Otros</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status-filter">Estado</Label>
                <Select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="todos">Todos</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="En proceso">En proceso</option>
                  <option value="Completada">Completada</option>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-gold">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 font-serif">Total Solicitudes</p>
                  <p className="text-3xl font-bold text-[#D4AF37] font-serif">{requests.length}</p>
                </div>
                <LayoutDashboard className="h-12 w-12 text-[#D4AF37]" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-gold">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 font-serif">Pendientes</p>
                  <p className="text-3xl font-bold text-yellow-400 font-serif">
                    {requests.filter((r) => r?.status === "Pendiente").length}
                  </p>
                </div>
                <Clock className="h-12 w-12 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-gold">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 font-serif">Completadas</p>
                  <p className="text-3xl font-bold text-green-400 font-serif">
                    {requests.filter((r) => r?.status === "Completada").length}
                  </p>
                </div>
                <CheckCircle className="h-12 w-12 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Solicitudes */}
        <Card className="shadow-gold-lg">
          <CardHeader>
            <CardTitle>Solicitudes ({filteredRequests.length})</CardTitle>
            <CardDescription>
              {filteredRequests.length === 0
                ? "No hay solicitudes que coincidan con los filtros"
                : "Click en una solicitud para ver los detalles"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 font-serif">No hay solicitudes para mostrar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <div
                    key={request?.id}
                    className="p-6 bg-[#1a1a1a] rounded-lg border-2 border-[#333333] hover:border-[#D4AF37] transition-all duration-300 cursor-pointer"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-6 w-6 text-[#D4AF37]" />
                        <div>
                          <h3 className="text-lg font-bold text-white font-serif">
                            {request?.type} - {request?.reference}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                            <span className="flex items-center space-x-1 font-serif">
                              <User className="h-4 w-4" />
                              <span>{request?.user?.name}</span>
                            </span>
                            <span className="flex items-center space-x-1 font-serif">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(request?.date).toLocaleDateString("es-ES")}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(request?.status)}
                    </div>

                    <p className="text-gray-300 text-sm mb-4 font-serif line-clamp-2">
                      {request?.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        {request?.attachments?.length > 0 && (
                          <span className="flex items-center space-x-1 font-serif">
                            <Download className="h-4 w-4" />
                            <span>{request.attachments.length} archivo(s)</span>
                          </span>
                        )}
                      </div>
                      <Select
                        value={request?.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateStatus(request?.id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-48"
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="En proceso">En proceso</option>
                        <option value="Completada">Completada</option>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Detalles */}
        {selectedRequest && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={() => setSelectedRequest(null)}
          >
            <Card
              className="max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-gold-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">
                      {selectedRequest?.type} - {selectedRequest?.reference}
                    </CardTitle>
                    <CardDescription className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span className="font-serif">
                          {selectedRequest?.user?.name} ({selectedRequest?.user?.email})
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span className="font-serif">
                          {new Date(selectedRequest?.date).toLocaleDateString("es-ES", {
                            dateStyle: "long",
                          })}
                        </span>
                      </div>
                    </CardDescription>
                  </div>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Estado</Label>
                  <div className="mt-2">{getStatusBadge(selectedRequest?.status)}</div>
                </div>

                <div>
                  <Label>Descripción</Label>
                  <div className="mt-2 p-4 bg-[#0a0a0a] rounded-lg border border-[#333333]">
                    <p className="text-white font-serif whitespace-pre-wrap">
                      {selectedRequest?.description}
                    </p>
                  </div>
                </div>

                {selectedRequest?.attachments?.length > 0 && (
                  <div>
                    <Label>Archivos Adjuntos ({selectedRequest.attachments.length})</Label>
                    <div className="mt-2 space-y-2">
                      {selectedRequest.attachments.map((attachment) => (
                        <div
                          key={attachment?.id}
                          className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg border border-[#333333] hover:border-[#D4AF37] transition-all duration-300"
                        >
                          <div className="flex items-center space-x-3">
                            <FileText className="h-8 w-8 text-[#D4AF37]" />
                            <span className="text-white font-serif">{attachment?.fileName}</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() =>
                              downloadFile(
                                attachment?.cloud_storage_path,
                                attachment?.fileName,
                                attachment?.isPublic
                              )
                            }
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Descargar
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label>Cambiar Estado</Label>
                  <Select
                    value={selectedRequest?.status}
                    onChange={(e) => updateStatus(selectedRequest?.id, e.target.value)}
                    className="mt-2"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="En proceso">En proceso</option>
                    <option value="Completada">Completada</option>
                  </Select>
                </div>

                <div className="flex justify-end pt-4 border-t-2 border-[#333333]">
                  <Button onClick={() => setSelectedRequest(null)} variant="outline">
                    Cerrar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
