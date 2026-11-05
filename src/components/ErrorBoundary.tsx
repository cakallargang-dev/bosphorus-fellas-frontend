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
        <div className="min-h-screen flex items-center justify-center bg-[#f5f7fb] px-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 mx-auto rounded-full border-2 border-red-500/30 flex items-center justify-center">
              <span className="text-red-500 text-2xl">!</span>
            </div>
            <h1 className="text-xl font-semibold text-[#0f1420]">Bir hata oluştu</h1>
            <p className="text-sm text-[#4a5568] break-all font-mono bg-white p-3 rounded">
              {this.state.error?.message || "Bilinmeyen hata"}
            </p>
            <div className="flex gap-3 justify-center pt-4">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="px-6 py-2 bg-[#3b82f6] text-black rounded-lg font-medium hover:bg-[#60a5fa] transition-colors"
              >
                Tekrar Dene
              </button>
              <Link
                href="/"
                className="px-6 py-2 border border-[#e6eaf3] text-[#2c3648] rounded-lg hover:bg-[#eef2f9] transition-colors"
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
