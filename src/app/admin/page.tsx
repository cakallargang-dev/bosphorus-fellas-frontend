"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  dashboardApi,
  applicationsApi,
  membersApi,
  eventsApi,
  newsApi,
  sponsorsApi,
} from "@/lib/api";
import { AdminGuard } from "@/components/AdminGuard";
import { Layout } from "@/components/Layout";
import { StatsCard, iconMap } from "@/components/StatsCard";
import { ApplicationDetail } from "@/components/ApplicationDetail";
import { FileUpload } from "@/components/FileUpload";
import { SkeletonCard, SkeletonTable } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LayoutDashboard,
  FileText,
  Users,
  Calendar,
  Newspaper,
  Shield,
  Eye,
  CheckCircle2,
  XCircle,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Star,
  Clock,
  AlertTriangle,
} from "lucide-react";
import type {
  MembershipApplication,
  User as UserType,
  Event,
  News,
  Sponsor,
} from "@/types";

// ============================================================
// Schemas
// ============================================================

const eventSchema = z.object({
  title: z.string().min(3, "Başlık en az 3 karakter olmalıdır"),
  description: z.string().min(10, "Açıklama en az 10 karakter olmalıdır"),
  date: z.string().min(1, "Tarih zorunludur"),
  time: z.string().min(1, "Saat zorunludur"),
  location: z.string().min(3, "Konum zorunludur"),
  locationUrl: z.string().optional(),
  maxParticipants: z.string().optional(),
});

const newsSchema = z.object({
  title: z.string().min(3, "Başlık en az 3 karakter olmalıdır"),
  content: z.string().min(10, "İçerik en az 10 karakter olmalıdır"),
});

const sponsorSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
  websiteUrl: z.string().optional(),
  description: z.string().optional(),
  tier: z.enum(["platinum", "gold", "silver", "bronze"]),
});

type EventFormValues = z.infer<typeof eventSchema>;
type NewsFormValues = z.infer<typeof newsSchema>;
type SponsorFormValues = z.infer<typeof sponsorSchema>;

// ============================================================
// Status badge helper
// ============================================================

const appStatusBadge: Record<
  string,
  { label: string; className: string }
> = {
  pending: {
    label: "Bekliyor",
    className: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  },
  approved: {
    label: "Onaylandı",
    className: "bg-green-500/20 text-green-500 border-green-500/30",
  },
  rejected: {
    label: "Reddedildi",
    className: "bg-red-500/20 text-red-500 border-red-500/30",
  },
};

const tierBadge: Record<string, { label: string; className: string }> = {
  platinum: {
    label: "Platin",
    className: "bg-gradient-to-r from-gray-300 to-gray-100 text-black border-gray-400",
  },
  gold: {
    label: "Altın",
    className: "bg-[#d4a853]/20 text-[#d4a853] border-[#d4a853]/30",
  },
  silver: {
    label: "Gümüş",
    className: "bg-gray-400/20 text-gray-400 border-gray-400/30",
  },
  bronze: {
    label: "Bronz",
    className: "bg-amber-700/20 text-amber-600 border-amber-700/30",
  },
};

// ============================================================
// Main Page
// ============================================================

export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminContent />
    </AdminGuard>
  );
}

function AdminContent() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-[#d4a853]/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#d4a853]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Yönetim Paneli</h1>
            <p className="text-gray-500 text-sm">
              Kulüp yönetimi ve üye işlemleri
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8 bg-[#111] border border-gray-800 p-1 w-full flex-wrap h-auto">
            <TabsTrigger value="dashboard" className="text-gray-400 data-active:bg-[#d4a853] data-active:text-black gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="applications" className="text-gray-400 data-active:bg-[#d4a853] data-active:text-black gap-2">
              <FileText className="w-4 h-4" />
              Başvurular
            </TabsTrigger>
            <TabsTrigger value="members" className="text-gray-400 data-active:bg-[#d4a853] data-active:text-black gap-2">
              <Users className="w-4 h-4" />
              Üyeler
            </TabsTrigger>
            <TabsTrigger value="events" className="text-gray-400 data-active:bg-[#d4a853] data-active:text-black gap-2">
              <Calendar className="w-4 h-4" />
              Etkinlikler
            </TabsTrigger>
            <TabsTrigger value="content" className="text-gray-400 data-active:bg-[#d4a853] data-active:text-black gap-2">
              <Newspaper className="w-4 h-4" />
              İçerik
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab />
          </TabsContent>

          <TabsContent value="applications">
            <ApplicationsTab />
          </TabsContent>

          <TabsContent value="members">
            <MembersTab />
          </TabsContent>

          <TabsContent value="events">
            <EventsTab />
          </TabsContent>

          <TabsContent value="content">
            <ContentTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

// ============================================================
// Dashboard Tab
// ============================================================

function DashboardTab() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => dashboardApi.getAdminStats(),
    staleTime: 10_000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-10 text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-gray-400">İstatistikler yüklenemedi</p>
      </div>
    );
  }

  const s = data?.data;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        title="Toplam Üye"
        value={s?.totalMembers ?? 0}
        icon={iconMap.members}
      />
      <StatsCard
        title="Bekleyen Başvuru"
        value={s?.pendingApplications ?? 0}
        icon={<Clock className="w-5 h-5" />}
      />
      <StatsCard
        title="Toplam Etkinlik"
        value={s?.totalEvents ?? 0}
        icon={iconMap.events}
      />
      <StatsCard
        title="Sponsorlar"
        value={s?.totalSponsors ?? 0}
        icon={iconMap.sponsors}
      />
    </div>
  );
}

// ============================================================
// Applications Tab
// ============================================================

function ApplicationsTab() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedApp, setSelectedApp] = useState<MembershipApplication | null>(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");
  const [reviewReason, setReviewReason] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "applications", statusFilter],
    queryFn: () =>
      applicationsApi.list({
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
    staleTime: 10_000,
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      action,
      reason,
    }: {
      id: string;
      action: "approve" | "reject";
      reason?: string;
    }) => applicationsApi.review({ applicationId: id, action, reason }),
    onSuccess: (data: any, vars) => {
      if (vars.action === "approve" && data?.data?.tempPassword) {
        toast.success("Başvuru onaylandı! 🎉", {
          description: `Geçici şifre: ${data.data.tempPassword}\nÜye bu şifreyle giriş yapabilir.`,
          duration: 15000,
        });
      } else {
        toast.success(
          vars.action === "approve"
            ? "Başvuru onaylandı!"
            : "Başvuru reddedildi"
        );
      }
      queryClient.invalidateQueries({ queryKey: ["admin", "applications"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "members"] });
      setReviewModal(false);
      setSelectedApp(null);
      setReviewReason("");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "İşlem başarısız oldu");
    },
  });

  const applications = data?.data ?? [];

  return (
    <div>
      {/* Filter */}
      <div className="flex items-center gap-3 mb-4">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
          <SelectTrigger className="w-36 bg-[#111] border-gray-800 text-gray-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-gray-800">
            <SelectItem value="all" className="text-gray-300">Tümü</SelectItem>
            <SelectItem value="pending" className="text-gray-300">Bekleyen</SelectItem>
            <SelectItem value="approved" className="text-gray-300">Onaylanan</SelectItem>
            <SelectItem value="rejected" className="text-gray-300">Reddedilen</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-600">
          {data?.total ?? 0} başvuru
        </span>
      </div>

      {isLoading ? (
        <SkeletonTable rows={5} />
      ) : isError ? (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-10 text-center">
          <p className="text-gray-400">Başvurular yüklenemedi</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-10 text-center">
          <FileText className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">Bu kategoride başvuru bulunmuyor</p>
        </div>
      ) : (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead className="text-gray-400">Ad Soyad</TableHead>
                <TableHead className="text-gray-400">E-posta</TableHead>
                <TableHead className="text-gray-400">Tarih</TableHead>
                <TableHead className="text-gray-400">Durum</TableHead>
                <TableHead className="text-gray-400 text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => {
                const badge = appStatusBadge[app.status] ?? appStatusBadge.pending;
                return (
                  <TableRow
                    key={app.id}
                    className="border-gray-800 cursor-pointer hover:bg-[#111]"
                    onClick={() => setSelectedApp(app)}
                  >
                    <TableCell className="text-white font-medium">
                      {app.firstName} {app.lastName}
                    </TableCell>
                    <TableCell className="text-gray-400">{app.email}</TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {/* Safe date formatter */}
{format(new Date(app.submittedAt || app.createdAt || Date.now()), "d MMM yyyy", { locale: tr })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${badge.className}`}>
                        {badge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-white h-8 w-8 p-0"
                          onClick={() => setSelectedApp(app)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {app.status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-500 hover:text-green-400 h-8 w-8 p-0"
                              onClick={() => {
                                setSelectedApp(app);
                                setReviewAction("approve");
                                setReviewReason("");
                                setReviewModal(true);
                              }}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-400 h-8 w-8 p-0"
                              onClick={() => {
                                setSelectedApp(app);
                                setReviewAction("reject");
                                setReviewReason("");
                                setReviewModal(true);
                              }}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Application Detail Dialog */}
      <ApplicationDetail
        application={selectedApp}
        open={!!selectedApp && !reviewModal}
        onClose={() => setSelectedApp(null)}
      />

      {/* Review Modal */}
      <Dialog open={reviewModal} onOpenChange={setReviewModal}>
        <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              {reviewAction === "approve" ? "Başvuruyu Onayla" : "Başvuruyu Reddet"}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              {reviewAction === "approve"
                ? "Bu başvuru onaylanacak ve üye hesabı oluşturulacak."
                : "Bu başvuru reddedilecek. İsteğe bağlı olarak bir sebep belirtebilirsiniz."}
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-[#111] border border-gray-800">
                <p className="text-white font-medium">
                  {selectedApp.firstName} {selectedApp.lastName}
                </p>
                <p className="text-sm text-gray-500">{selectedApp.email}</p>
              </div>

              {reviewAction === "reject" && (
                <div className="space-y-2">
                  <Label className="text-gray-300">Red Sebebi (Opsiyonel)</Label>
                  <Textarea
                    placeholder="Red sebebini açıklayın..."
                    rows={3}
                    value={reviewReason}
                    onChange={(e) => setReviewReason(e.target.value)}
                    className="bg-[#111] border-gray-800 text-white focus:border-[#d4a853]/50 resize-none"
                  />
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setReviewModal(false);
                    setReviewReason("");
                  }}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  İptal
                </Button>
                <Button
                  onClick={() =>
                    reviewMutation.mutate({
                      id: selectedApp.id,
                      action: reviewAction,
                      reason: reviewReason || undefined,
                    })
                  }
                  disabled={reviewMutation.isPending}
                  className={
                    reviewAction === "approve"
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }
                >
                  {reviewMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : reviewAction === "approve" ? (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  {reviewAction === "approve" ? "Onayla" : "Reddet"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Members Tab
// ============================================================

function MembersTab() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "members", statusFilter],
    queryFn: () =>
      membersApi.list({
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
    staleTime: 10_000,
  });

  const toggleMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "active" | "inactive";
    }) => membersApi.toggleStatus(id, status),
    onSuccess: () => {
      toast.success("Üye durumu güncellendi");
      queryClient.invalidateQueries({ queryKey: ["admin", "members"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "İşlem başarısız oldu"
      );
    },
  });

  const members = data?.data ?? [];
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
          <SelectTrigger className="w-36 bg-[#111] border-gray-800 text-gray-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-gray-800">
            <SelectItem value="all" className="text-gray-300">Tümü</SelectItem>
            <SelectItem value="active" className="text-gray-300">Aktif</SelectItem>
            <SelectItem value="inactive" className="text-gray-300">Pasif</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-600">
          {data?.total ?? 0} üye
        </span>
      </div>

      {isLoading ? (
        <SkeletonTable rows={5} />
      ) : isError ? (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-10 text-center">
          <p className="text-gray-400">Üyeler yüklenemedi</p>
        </div>
      ) : members.length === 0 ? (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-10 text-center">
          <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">Henüz üye bulunmuyor</p>
        </div>
      ) : (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead className="text-gray-400">Üye</TableHead>
                <TableHead className="text-gray-400">E-posta</TableHead>
                <TableHead className="text-gray-400">Şehir</TableHead>
                <TableHead className="text-gray-400">Rol</TableHead>
                <TableHead className="text-gray-400">Durum</TableHead>
                <TableHead className="text-gray-400 text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member: UserType) => (
                <TableRow key={member.id} className="border-gray-800 hover:bg-[#111]">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage
                          src={
                            member.avatar
                              ? `${apiBase}${member.avatar}`
                              : undefined
                          }
                        />
                        <AvatarFallback className="bg-[#d4a853]/10 text-[#d4a853] text-xs">
                          {member.firstName?.[0]}
                          {member.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white font-medium text-sm">
                        {member.firstName} {member.lastName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-400 text-sm">
                    {member.email}
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {member.city || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        member.role === "admin"
                          ? "bg-[#d4a853]/20 text-[#d4a853] border-[#d4a853]/30"
                          : "bg-gray-700/20 text-gray-400 border-gray-700/30"
                      }`}
                    >
                      {member.role === "admin" ? "Admin" : "Üye"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1 text-xs ${
                        member.status === "active"
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          member.status === "active"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      />
                      {member.status === "active" ? "Aktif" : "Pasif"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        toggleMutation.mutate({
                          id: member.id,
                          status:
                            member.status === "active" ? "inactive" : "active",
                        })
                      }
                      disabled={toggleMutation.isPending}
                      className={
                        member.status === "active"
                          ? "border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
                          : "border-green-500/30 text-green-400 hover:bg-green-500/10 text-xs"
                      }
                    >
                      {member.status === "active" ? "Pasif Yap" : "Aktif Yap"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Events Tab
// ============================================================

function EventsTab() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventImage, setEventImage] = useState<File | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "events"],
    queryFn: () => eventsApi.list(),
    staleTime: 10_000,
  });

  const createMutation = useMutation({
    mutationFn: (formData: EventFormValues & { image?: File }) =>
      eventsApi.create({
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        locationUrl: formData.locationUrl || undefined,
        maxParticipants: formData.maxParticipants
          ? parseInt(formData.maxParticipants, 10)
          : undefined,
        image: formData.image,
      }),
    onSuccess: () => {
      toast.success("Etkinlik oluşturuldu!");
      queryClient.invalidateQueries({ queryKey: ["admin", "events"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      setModalOpen(false);
      setEditingEvent(null);
      setEventImage(null);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Hata"),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      ...formData
    }: EventFormValues & { id: string; image?: File }) =>
      eventsApi.update(id, {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        locationUrl: formData.locationUrl || undefined,
        maxParticipants: formData.maxParticipants
          ? parseInt(formData.maxParticipants, 10)
          : undefined,
        image: formData.image,
      }),
    onSuccess: () => {
      toast.success("Etkinlik güncellendi!");
      queryClient.invalidateQueries({ queryKey: ["admin", "events"] });
      setModalOpen(false);
      setEditingEvent(null);
      setEventImage(null);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Hata"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventsApi.delete(id),
    onSuccess: () => {
      toast.success("Etkinlik silindi!");
      queryClient.invalidateQueries({ queryKey: ["admin", "events"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Hata"),
  });

  const events = data?.data ?? [];

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setEventImage(null);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingEvent(null);
    setEventImage(null);
    setModalOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-600">{events.length} etkinlik</span>
        <Button
          onClick={handleCreate}
          className="bg-[#d4a853] text-black hover:bg-[#e2c278] font-medium text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Etkinlik
        </Button>
      </div>

      {isLoading ? (
        <SkeletonTable rows={5} />
      ) : isError ? (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-10 text-center">
          <p className="text-gray-400">Etkinlikler yüklenemedi</p>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-10 text-center">
          <Calendar className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">Henüz etkinlik yok</p>
        </div>
      ) : (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead className="text-gray-400">Etkinlik</TableHead>
                <TableHead className="text-gray-400">Tarih</TableHead>
                <TableHead className="text-gray-400">Konum</TableHead>
                <TableHead className="text-gray-400">Katılımcı</TableHead>
                <TableHead className="text-gray-400">Durum</TableHead>
                <TableHead className="text-gray-400 text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event: Event) => (
                <TableRow key={event.id} className="border-gray-800 hover:bg-[#111]">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {event.imageUrl && (
                        <img
                          src={
                            event.imageUrl.startsWith("http")
                              ? event.imageUrl
                              : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050"}${event.imageUrl}`
                          }
                          alt=""
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      <span className="text-white font-medium text-sm">
                        {event.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-400 text-sm">
                    {format(new Date(event.date), "d MMM yyyy", { locale: tr })}
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm max-w-[150px] truncate">
                    {event.location}
                  </TableCell>
                  <TableCell className="text-gray-400 text-sm">
                    {event.currentParticipants}
                    {event.maxParticipants ? `/${event.maxParticipants}` : ""}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        event.status === "upcoming"
                          ? "bg-[#d4a853]/20 text-[#d4a853] border-[#d4a853]/30"
                          : event.status === "ongoing"
                          ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                          : event.status === "completed"
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-red-500/20 text-red-400 border-red-500/30"
                      }`}
                    >
                      {event.status === "upcoming"
                        ? "Yakında"
                        : event.status === "ongoing"
                        ? "Devam Ediyor"
                        : event.status === "completed"
                        ? "Tamamlandı"
                        : "İptal"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-white h-8 w-8 p-0"
                        onClick={() => handleEdit(event)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-400 h-8 w-8 p-0"
                        onClick={() => {
                          if (confirm("Bu etkinliği silmek istediğinize emin misiniz?")) {
                            deleteMutation.mutate(event.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Event Form Dialog */}
      <EventFormDialog
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingEvent(null);
          setEventImage(null);
        }}
        editingEvent={editingEvent}
        imageFile={eventImage}
        onImageChange={setEventImage}
        onSubmit={(data) => {
          if (editingEvent) {
            updateMutation.mutate({
              id: editingEvent.id,
              ...data,
              image: eventImage || undefined,
            });
          } else {
            createMutation.mutate({
              ...data,
              image: eventImage || undefined,
            });
          }
        }}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}

// ============================================================
// Content Tab (News + Sponsors)
// ============================================================

function ContentTab() {
  const [subTab, setSubTab] = useState("news");

  return (
    <div>
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="mb-6 bg-[#111] border border-gray-800 p-1">
          <TabsTrigger value="news" className="text-gray-400 data-active:bg-[#d4a853] data-active:text-black gap-2">
            <Newspaper className="w-4 h-4" />
            Haberler
          </TabsTrigger>
          <TabsTrigger value="sponsors" className="text-gray-400 data-active:bg-[#d4a853] data-active:text-black gap-2">
            <Star className="w-4 h-4" />
            Sponsorlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="news">
          <NewsSubTab />
        </TabsContent>

        <TabsContent value="sponsors">
          <SponsorsSubTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NewsSubTab() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [newsImage, setNewsImage] = useState<File | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "news"],
    queryFn: () => newsApi.list(),
    staleTime: 10_000,
  });

  const createMutation = useMutation({
    mutationFn: (data: NewsFormValues & { image?: File }) =>
      newsApi.create(data),
    onSuccess: () => {
      toast.success("Haber oluşturuldu!");
      queryClient.invalidateQueries({ queryKey: ["admin", "news"] });
      setModalOpen(false);
      setEditingNews(null);
      setNewsImage(null);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Hata"),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      ...data
    }: NewsFormValues & { id: string; image?: File }) =>
      newsApi.update(id, data),
    onSuccess: () => {
      toast.success("Haber güncellendi!");
      queryClient.invalidateQueries({ queryKey: ["admin", "news"] });
      setModalOpen(false);
      setEditingNews(null);
      setNewsImage(null);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Hata"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => newsApi.delete(id),
    onSuccess: () => {
      toast.success("Haber silindi!");
      queryClient.invalidateQueries({ queryKey: ["admin", "news"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Hata"),
  });

  const newsItems = data?.data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-600">{newsItems.length} haber</span>
        <Button
          onClick={() => {
            setEditingNews(null);
            setNewsImage(null);
            setModalOpen(true);
          }}
          className="bg-[#d4a853] text-black hover:bg-[#e2c278] font-medium text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Haber
        </Button>
      </div>

      {isLoading ? (
        <SkeletonTable rows={4} />
      ) : isError ? (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-10 text-center">
          <p className="text-gray-400">Haberler yüklenemedi</p>
        </div>
      ) : newsItems.length === 0 ? (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-10 text-center">
          <Newspaper className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">Henüz haber yok</p>
        </div>
      ) : (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead className="text-gray-400">Haber</TableHead>
                <TableHead className="text-gray-400">Yazar</TableHead>
                <TableHead className="text-gray-400">Tarih</TableHead>
                <TableHead className="text-gray-400 text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {newsItems.map((item: News) => (
                <TableRow key={item.id} className="border-gray-800 hover:bg-[#111]">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {item.imageUrl && (
                        <img
                          src={
                            item.imageUrl.startsWith("http")
                              ? item.imageUrl
                              : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050"}${item.imageUrl}`
                          }
                          alt=""
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      <span className="text-white font-medium text-sm max-w-[300px] truncate">
                        {item.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-400 text-sm">
                    {item.authorName}
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {format(new Date(item.createdAt), "d MMM yyyy", {
                      locale: tr,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-white h-8 w-8 p-0"
                        onClick={() => {
                          setEditingNews(item);
                          setNewsImage(null);
                          setModalOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-400 h-8 w-8 p-0"
                        onClick={() => {
                          if (confirm("Bu haberi silmek istediğinize emin misiniz?")) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* News Form Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingNews ? "Haberi Düzenle" : "Yeni Haber"}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              {editingNews
                ? "Haber içeriğini güncelleyin"
                : "Yeni bir haber veya duyuru oluşturun"}
            </DialogDescription>
          </DialogHeader>

          <NewsSponsorForm
            type="news"
            editingItem={editingNews}
            imageFile={newsImage}
            onImageChange={setNewsImage}
            onSubmit={(data) => {
              if (editingNews) {
                updateMutation.mutate({
                  id: editingNews.id,
                  ...data,
                  image: newsImage || undefined,
                });
              } else {
                createMutation.mutate({
                  ...data,
                  image: newsImage || undefined,
                });
              }
            }}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
            onClose={() => {
              setModalOpen(false);
              setEditingNews(null);
              setNewsImage(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SponsorsSubTab() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [sponsorLogo, setSponsorLogo] = useState<File | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "sponsors"],
    queryFn: () => sponsorsApi.list(),
    staleTime: 10_000,
  });

  const createMutation = useMutation({
    mutationFn: (data: SponsorFormValues & { logo?: File }) =>
      sponsorsApi.create(data),
    onSuccess: () => {
      toast.success("Sponsor oluşturuldu!");
      queryClient.invalidateQueries({ queryKey: ["admin", "sponsors"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      setModalOpen(false);
      setEditingSponsor(null);
      setSponsorLogo(null);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Hata"),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      ...data
    }: SponsorFormValues & { id: string; logo?: File }) =>
      sponsorsApi.update(id, data),
    onSuccess: () => {
      toast.success("Sponsor güncellendi!");
      queryClient.invalidateQueries({ queryKey: ["admin", "sponsors"] });
      setModalOpen(false);
      setEditingSponsor(null);
      setSponsorLogo(null);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Hata"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sponsorsApi.delete(id),
    onSuccess: () => {
      toast.success("Sponsor silindi!");
      queryClient.invalidateQueries({ queryKey: ["admin", "sponsors"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Hata"),
  });

  const sponsors = data?.data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-600">
          {sponsors.length} sponsor
        </span>
        <Button
          onClick={() => {
            setEditingSponsor(null);
            setSponsorLogo(null);
            setModalOpen(true);
          }}
          className="bg-[#d4a853] text-black hover:bg-[#e2c278] font-medium text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Sponsor
        </Button>
      </div>

      {isLoading ? (
        <SkeletonTable rows={4} />
      ) : isError ? (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-10 text-center">
          <p className="text-gray-400">Sponsorlar yüklenemedi</p>
        </div>
      ) : sponsors.length === 0 ? (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-10 text-center">
          <Star className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">Henüz sponsor yok</p>
        </div>
      ) : (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead className="text-gray-400">Sponsor</TableHead>
                <TableHead className="text-gray-400">Seviye</TableHead>
                <TableHead className="text-gray-400">Website</TableHead>
                <TableHead className="text-gray-400">Durum</TableHead>
                <TableHead className="text-gray-400 text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sponsors.map((sp: Sponsor) => {
                const tier = tierBadge[sp.tier] ?? tierBadge.bronze;
                return (
                  <TableRow key={sp.id} className="border-gray-800 hover:bg-[#111]">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {sp.logoUrl && (
                          <img
                            src={
                              sp.logoUrl.startsWith("http")
                                ? sp.logoUrl
                                : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050"}${sp.logoUrl}`
                            }
                            alt=""
                            className="w-8 h-8 rounded object-contain bg-black/20"
                          />
                        )}
                        <span className="text-white font-medium text-sm">
                          {sp.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${tier.className}`}
                      >
                        {tier.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm max-w-[120px] truncate">
                      {sp.websiteUrl || "-"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs ${
                          sp.isActive ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {sp.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-white h-8 w-8 p-0"
                          onClick={() => {
                            setEditingSponsor(sp);
                            setSponsorLogo(null);
                            setModalOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-400 h-8 w-8 p-0"
                          onClick={() => {
                            if (confirm("Bu sponsoru silmek istediğinize emin misiniz?")) {
                              deleteMutation.mutate(sp.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Sponsor Form Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingSponsor ? "Sponsoru Düzenle" : "Yeni Sponsor"}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              {editingSponsor
                ? "Sponsor bilgilerini güncelleyin"
                : "Yeni bir sponsor ekleyin"}
            </DialogDescription>
          </DialogHeader>

          <NewsSponsorForm
            type="sponsor"
            editingItem={editingSponsor}
            imageFile={sponsorLogo}
            onImageChange={setSponsorLogo}
            onSubmit={(data) => {
              if (editingSponsor) {
                updateMutation.mutate({
                  id: editingSponsor.id,
                  ...data,
                  logo: sponsorLogo || undefined,
                });
              } else {
                createMutation.mutate({
                  ...data,
                  logo: sponsorLogo || undefined,
                });
              }
            }}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
            onClose={() => {
              setModalOpen(false);
              setEditingSponsor(null);
              setSponsorLogo(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Reusable Forms
// ============================================================

function EventFormDialog({
  open,
  onClose,
  editingEvent,
  imageFile,
  onImageChange,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onClose: () => void;
  editingEvent: Event | null;
  imageFile: File | null;
  onImageChange: (file: File | null) => void;
  onSubmit: (data: EventFormValues) => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: editingEvent
      ? {
          title: editingEvent.title,
          description: editingEvent.description,
          date: editingEvent.date
            ? editingEvent.date.split("T")[0]
            : "",
          time: editingEvent.time,
          location: editingEvent.location,
          locationUrl: editingEvent.locationUrl || "",
          maxParticipants: editingEvent.maxParticipants?.toString() || "",
        }
      : {},
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">
            {editingEvent ? "Etkinliği Düzenle" : "Yeni Etkinlik"}
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            {editingEvent
              ? "Etkinlik bilgilerini güncelleyin"
              : "Yeni bir etkinlik oluşturun"}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 max-h-[60vh] overflow-y-auto pr-1"
        >
          <div className="space-y-2">
            <Label className="text-gray-300">Başlık</Label>
            <Input
              {...register("title")}
              placeholder="Etkinlik başlığı"
              className="bg-[#111] border-gray-800 text-white"
            />
            {errors.title && (
              <p className="text-red-400 text-xs">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Açıklama</Label>
            <Textarea
              {...register("description")}
              placeholder="Etkinlik açıklaması"
              rows={3}
              className="bg-[#111] border-gray-800 text-white resize-none"
            />
            {errors.description && (
              <p className="text-red-400 text-xs">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Tarih</Label>
              <Input
                {...register("date")}
                type="date"
                className="bg-[#111] border-gray-800 text-white [color-scheme:dark]"
              />
              {errors.date && (
                <p className="text-red-400 text-xs">{errors.date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Saat</Label>
              <Input
                {...register("time")}
                type="time"
                className="bg-[#111] border-gray-800 text-white [color-scheme:dark]"
              />
              {errors.time && (
                <p className="text-red-400 text-xs">{errors.time.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Konum</Label>
            <Input
              {...register("location")}
              placeholder="Mekan adı / adresi"
              className="bg-[#111] border-gray-800 text-white"
            />
            {errors.location && (
              <p className="text-red-400 text-xs">{errors.location.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Konum URL (opsiyonel)</Label>
              <Input
                {...register("locationUrl")}
                placeholder="Google Maps linki"
                className="bg-[#111] border-gray-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Maks. Katılımcı</Label>
              <Input
                {...register("maxParticipants")}
                type="number"
                placeholder="Sınırsız"
                className="bg-[#111] border-gray-800 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Etkinlik Görseli</Label>
            <FileUpload
              value={
                imageFile ||
                (editingEvent?.imageUrl ? editingEvent.imageUrl : null)
              }
              onChange={onImageChange}
              label="Görsel yüklemek için tıklayın"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#d4a853] text-black hover:bg-[#e2c278] font-medium"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : editingEvent ? (
                <Pencil className="w-4 h-4 mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {editingEvent ? "Güncelle" : "Oluştur"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NewsSponsorForm({
  type,
  editingItem,
  imageFile,
  onImageChange,
  onSubmit,
  isSubmitting,
  onClose,
}: {
  type: "news" | "sponsor";
  editingItem: News | Sponsor | null;
  imageFile: File | null;
  onImageChange: (file: File | null) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  onClose: () => void;
}) {
  const isEditing = !!editingItem;
  const schema = type === "news" ? newsSchema : sponsorSchema;
  const defaultValues: Record<string, string> = {};

  if (editingItem) {
    if (type === "news") {
      const n = editingItem as News;
      defaultValues.title = n.title;
      defaultValues.content = n.content;
    } else {
      const s = editingItem as Sponsor;
      defaultValues.name = s.name;
      defaultValues.websiteUrl = s.websiteUrl || "";
      defaultValues.description = s.description || "";
      defaultValues.tier = s.tier;
    }
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(schema as any),
    defaultValues,
  });

  const tierValue = type === "sponsor" ? watch("tier") : undefined;

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit(data as any))}
      className="space-y-4 max-h-[60vh] overflow-y-auto pr-1"
    >
      {type === "news" ? (
        <>
          <div className="space-y-2">
            <Label className="text-gray-300">Başlık</Label>
            <Input
              {...register("title")}
              placeholder="Haber başlığı"
              className="bg-[#111] border-gray-800 text-white"
            />
            {errors.title && (
              <p className="text-red-400 text-xs">
                {(errors.title as any)?.message as string}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">İçerik</Label>
            <Textarea
              {...register("content")}
              placeholder="Haber içeriği..."
              rows={5}
              className="bg-[#111] border-gray-800 text-white resize-none"
            />
            {errors.content && (
              <p className="text-red-400 text-xs">
                {(errors.content as any)?.message as string}
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="space-y-2">
            <Label className="text-gray-300">Sponsor Adı</Label>
            <Input
              {...register("name")}
              placeholder="Sponsor adı"
              className="bg-[#111] border-gray-800 text-white"
            />
            {errors.name && (
              <p className="text-red-400 text-xs">
                {(errors.name as any)?.message as string}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Website URL (opsiyonel)</Label>
            <Input
              {...register("websiteUrl")}
              placeholder="https://..."
              className="bg-[#111] border-gray-800 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Açıklama (opsiyonel)</Label>
            <Textarea
              {...register("description")}
              placeholder="Sponsor hakkında..."
              rows={2}
              className="bg-[#111] border-gray-800 text-white resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Seviye</Label>
            <Select
              value={tierValue || "bronze"}
              onValueChange={(v) =>
                setValue("tier", v as SponsorFormValues["tier"])
              }
            >
              <SelectTrigger className="bg-[#111] border-gray-800 text-gray-300 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-gray-800">
                <SelectItem value="platinum" className="text-gray-300">
                  Platin
                </SelectItem>
                <SelectItem value="gold" className="text-gray-300">
                  Altın
                </SelectItem>
                <SelectItem value="silver" className="text-gray-300">
                  Gümüş
                </SelectItem>
                <SelectItem value="bronze" className="text-gray-300">
                  Bronz
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.tier && (
              <p className="text-red-400 text-xs">
                {(errors.tier as any)?.message as string}
              </p>
            )}
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label className="text-gray-300">
          {type === "news" ? "Haber Görseli" : "Sponsor Logosu"}
        </Label>
        <FileUpload
          value={
            imageFile ||
            (editingItem &&
            (type === "news"
              ? (editingItem as News).imageUrl
              : (editingItem as Sponsor).logoUrl)
              ? type === "news"
                ? (editingItem as News).imageUrl!
                : (editingItem as Sponsor).logoUrl!
              : null)
          }
          onChange={onImageChange}
          label={
            type === "news"
              ? "Görsel yüklemek için tıklayın"
              : "Logo yüklemek için tıklayın"
          }
        />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="border-gray-700 text-gray-300 hover:bg-gray-800"
        >
          İptal
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#d4a853] text-black hover:bg-[#e2c278] font-medium"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : isEditing ? (
            <Pencil className="w-4 h-4 mr-2" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          {isEditing ? "Güncelle" : "Oluştur"}
        </Button>
      </div>
    </form>
  );
}
