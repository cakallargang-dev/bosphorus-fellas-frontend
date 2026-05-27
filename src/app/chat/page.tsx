"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { MessageCircle } from "lucide-react";

export default function ChatPage() {
  return (
    <AuthGuard>
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-mancave-gold/10 flex items-center justify-center mb-6">
            <MessageCircle className="w-10 h-10 text-mancave-gold" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Sohbet</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Kulüp içi sohbet yakında burada olacak. Şimdilik diğer üyelerle iletişim için WhatsApp grubumuzu kullanabilirsin.
          </p>
        </div>
      </Layout>
    </AuthGuard>
  );
}
