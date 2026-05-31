"use client";

import AuthProvider from "@/app/components/AuthProvider";
import { DataProvider } from "@/app/components/DataProvider";

export default function GamesProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DataProvider>{children}</DataProvider>
    </AuthProvider>
  );
}
