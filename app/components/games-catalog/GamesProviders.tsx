"use client";

import AuthProvider from "@/app/components/AuthProvider";
import { DataProvider } from "@/app/components/DataProvider";
import BowieEasterEggListener from "@/app/components/BowieEasterEggListener";

export default function GamesProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DataProvider>
        <BowieEasterEggListener />
        {children}
      </DataProvider>
    </AuthProvider>
  );
}
