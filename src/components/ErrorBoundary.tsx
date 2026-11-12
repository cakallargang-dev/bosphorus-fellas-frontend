"use client";

import { Component, type ReactNode } from "react";
import Link from "next/link";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-mancave-bg px-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 mx-auto rounded-full border-2 border-red-500/30 flex items-center justify-center">
              <span className="text-red-500 text-2xl">!</span>
            </div>
            <h1 className="text-xl font-semibold text-white">Bir hata oluştu</h1>
            <p className="text-sm text-[#8f9fb4] break-all font-mono bg-[#0f1d32] p-3 rounded">
              {this.state.error?.message || "Bilinmeyen hata"}
            </p>
            <div className="flex gap-3 justify-center pt-4">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="px-6 py-2 bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] text-black rounded-lg font-medium hover:bg-[#60a5fa] transition-colors"
              >
                Tekrar Dene
              </button>
              <Link
                href="/"
                className="tap px-6 py-2 border border-[#162544] text-[#b9c6d8] rounded-lg hover:bg-[#0a1628] transition-colors"
              >
                Ana Sayfa
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
