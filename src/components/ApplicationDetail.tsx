"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { MembershipApplication } from "@/types";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Car,
  Camera,
  Briefcase,
  FileText,
  Clock,
} from "lucide-react";

interface ApplicationDetailProps {
  application: MembershipApplication | null;
  open: boolean;
  onClose: () => void;
}

function safeDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function safeFormat(dateStr: string | null | undefined, fmt: string): string {
  const d = safeDate(dateStr);
  return d ? format(d, fmt, { locale: tr }) : '-';
}

const statusBadge: Record<string, { label: string; className: string }> = {
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

export function ApplicationDetail({
  application,
  open,
  onClose,
}: ApplicationDetailProps) {
  if (!application) return null;

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";
  const status = statusBadge[application.status] || statusBadge.pending;

  const fields = [
    { icon: Mail, label: "E-posta", value: application.email },
    { icon: Phone, label: "Telefon", value: application.phone },
    {
      icon: Calendar,
      label: "Doğum Tarihi",
      value: safeFormat(application.birthDate, "d MMMM yyyy"),
    },
    { icon: MapPin, label: "Şehir", value: application.city },
    { icon: Car, label: "Araç", value: `${application.carYear} ${application.carBrand} ${application.carModel}` },
    application.instagram
      ? { icon: Camera, label: "Instagram", value: `@${application.instagram}` }
      : null,
    application.occupation
      ? { icon: Briefcase, label: "Meslek", value: application.occupation }
      : null,
  ].filter(Boolean) as { icon: React.ElementType; label: string; value: string }[];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-mancave-card border-mancave-border text-white max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-white text-lg">
              {application.firstName} {application.lastName}
            </DialogTitle>
            <Badge
              variant="outline"
              className={`text-xs ${status.className}`}
            >
              {status.label}
            </Badge>
          </div>
          <DialogDescription className="text-mancave-muted">
            Başvuru detayları
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-5">
          {/* Photo */}
          {application.photoUrl && (
            <div className="flex justify-center">
              <img
                src={`${apiBase}${application.photoUrl}`}
                alt={`${application.firstName} ${application.lastName}`}
                className="w-32 h-32 rounded-full object-cover border-2 border-mancave-border"
              />
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fields.map((field, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg bg-mancave-surface border border-mancave-border"
              >
                <div className="w-8 h-8 rounded bg-mancave-blue/10 flex items-center justify-center shrink-0">
                  <field.icon className="w-4 h-4 text-mancave-blue" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-mancave-muted">{field.label}</p>
                  <p className="text-sm text-white truncate">{field.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* About */}
          <div>
            <h4 className="text-sm text-gray-400 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-mancave-blue" />
              Hakkında
            </h4>
            <p className="text-sm text-gray-300 bg-mancave-surface rounded-lg p-3 border border-mancave-border whitespace-pre-wrap">
              {application.about}
            </p>
          </div>

          {/* Expectation */}
          {application.expectation && (
            <div>
              <h4 className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-mancave-blue" />
                Beklenti
              </h4>
              <p className="text-sm text-gray-300 bg-mancave-surface rounded-lg p-3 border border-mancave-border whitespace-pre-wrap">
                {application.expectation}
              </p>
            </div>
          )}

          {/* Rejection reason */}
          {application.status === "rejected" && application.rejectionReason && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-400 font-medium mb-1">
                Red Sebebi
              </p>
              <p className="text-sm text-red-300">
                {application.rejectionReason}
              </p>
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-mancave-muted pt-2 border-t border-mancave-border">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Başvuru:{" "}
              {safeFormat(application.submittedAt || application.createdAt, "d MMM yyyy HH:mm")}
            </span>
            {application.reviewedAt && (
              <span>
                Değerlendirme:{" "}
                {safeFormat(application.reviewedAt, "d MMM yyyy HH:mm")}
              </span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
