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
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import {
  LayoutDashboard,
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
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [typeFilter, setTypeFilter] = useState("todos");

  useEffect(() => {
    if (status === "authenticated") {
      fetchRequests();
    }
  }, [status]);

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

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (
      !destination ||
      (source.droppableId === destination.droppableId &&
        source.index === destination.index)
    ) {
      return;
    }

    const statusMap: Record<string, string> = {
      "pendientes": "Pendiente",
      "en-proceso": "En proceso",
      "completadas": "Completada",
    };

    const newStatus = statusMap[destination.droppableId];

    try {
      const response = await fetch(`/api/requests/${draggableId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Error updating status");

      setRequests(
        requests.map((req) =>
          req.id === draggableId ? { ...req, status: newStatus } : req
        )
      );

      if (selectedRequest?.id === draggableId) {
        setSelectedRequest({ ...selectedRequest, status: newStatus });
      }
    } catch (error) {
      console.error("Error:", error);
      fetchRequests();
    }
  };

  const downloadFile = async (
    cloud_storage_path: string,
    fileName: string,
    isPublic: boolean
  ) => {
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

  const pendingRequests = requests
    .filter((r) => r.status === "Pendiente")
    .filter((r) => typeFilter === "todos" || r.type === typeFilter);
  const inProgressRequests = requests
    .filter((r) => r.status === "En proceso")
    .filter((r) => typeFilter === "todos" || r.type === typeFilter);
  const completedRequests = requests
    .filter((r) => r.status === "Completada")
    .filter((r) => typeFilter === "todos" || r.type === typeFilter);

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

  const KanbanColumn = ({
    title,
    requests: columnRequests,
    droppableId,
    count,
    icon: Icon,
    color,
  }: {
    title: string;
    requests: Request[];
    droppableId: string;
    count: number;
    icon: any;
    color: string;
  }) => (
    <div className="flex-1 min-w-0">
      <div className={`rounded-t-lg p-4 ${color}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className="h-5 w-5" />
            <h3 className="font-bold font-serif">{title}</h3>
          </div>
          <span className="bg-black/30 rounded-full px-3 py-1 text-sm font-bold">
            {count}
          </span>
        </div>
      </div>

      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`bg-[#0a0a0a] rounded-b-lg p-4 space-y-3 min-h-[500px] ${
              snapshot.isDraggingOver ? "bg-[#1a1a1a]" : ""
            }`}
          >
            {columnRequests.map((request, index) => (
              <Draggable key={request.id} draggableId={request.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`p-4 bg-[#1a1a1a] rounded-lg border-2 border-[#333333] cursor-move transition-all duration-200 ${
                      snapshot.isDragging
                        ? "shadow-lg shadow-[#D4AF37] border-[#D4AF37]"
                        : "hover:border-[#D4AF37]"
                    }`}
                    onClick={() => setSelectedRequest(request)}
                  >
                    <div
                      className="flex items-start justify-between mb-3"
                    >
                      <div className="flex items-center space-x-2 flex-1">
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-white font-serif truncate">
                            {request.type}
                          </h4>
                          <p className="text-xs text-gray-400 font-serif truncate">
                            {request.reference}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-gray-300 mb-3 line-clamp-2 font-serif">
                      {request.description}
                    </p>

                    <div className="space-y-2 text-xs text-gray-400 font-serif mb-3">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span className="truncate">{request.user?.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(request.date).toLocaleDateString("es-ES")}
                        </span>
                      </div>
                    </div>

                    {request.attachments?.length > 0 && (
                      <div className="text-xs text-yellow-400 font-serif">
                        📎 {request.attachments.length} archivo(s)
                      </div>
                    )}
                  </div>
                )}
              </Draggable>
            ))}
            {columnRequests.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-8 w-8 text-gray-600 mx-auto mb-2 opacity-50" />
                <p className="text-gray-500 text-xs font-serif">Sin solicitudes</p>
              </div>
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );

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
              className="object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-gradient mb-3 font-serif">Panel de Administración</h1>
          <p className="text-gray-400 text-lg font-serif">Gestiona todas las solicitudes de documentación</p>
        </div>

        {/* Filtro por tipo de documento */}
        <Card className="mb-8 shadow-gold">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Filtrar por tipo de documento</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="todos">Todos los tipos</option>
                <option value="Factura">Factura</option>
                <option value="Albarán">Albarán</option>
                <option value="Nota de entrega">Nota de entrega</option>
                <option value="Contrato">Contrato</option>
                <option value="Otros">Otros</option>
              </Select>
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
                  <p className="text-3xl font-bold text-[#D4AF37] font-serif">
                    {pendingRequests.length + inProgressRequests.length + completedRequests.length}
                  </p>
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
                    {pendingRequests.length}
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
                    {completedRequests.length}
                  </p>
                </div>
                <CheckCircle className="h-12 w-12 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
        <Card className="shadow-gold-lg overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-6 w-6" />
              <span>Gestión Documentos</span>
            </CardTitle>
            <CardDescription>
              Arrastra las solicitudes entre columnas para cambiar su estado
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="flex gap-4 p-6 bg-black overflow-x-auto">
                <KanbanColumn
                  title="Pendientes"
                  requests={pendingRequests}
                  droppableId="pendientes"
                  count={pendingRequests.length}
                  icon={Clock}
                  color="bg-yellow-900/50 text-yellow-400"
                />
                <KanbanColumn
                  title="En Proceso"
                  requests={inProgressRequests}
                  droppableId="en-proceso"
                  count={inProgressRequests.length}
                  icon={AlertCircle}
                  color="bg-blue-900/50 text-blue-400"
                />
                <KanbanColumn
                  title="Completadas"
                  requests={completedRequests}
                  droppableId="completadas"
                  count={completedRequests.length}
                  icon={CheckCircle}
                  color="bg-green-900/50 text-green-400"
                />
              </div>
            </DragDropContext>
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
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      setRequests(
                        requests.map((req) =>
                          req.id === selectedRequest?.id
                            ? { ...req, status: newStatus }
                            : req
                        )
                      );
                      setSelectedRequest({
                        ...selectedRequest,
                        status: newStatus,
                      });
                      fetch(`/api/requests/${selectedRequest?.id}/status`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: newStatus }),
                      }).catch(console.error);
                    }}
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
