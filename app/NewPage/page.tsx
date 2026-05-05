"use client";

import ForumsPage from "../components/ForumsPage";
import AuthProvider from "../components/AuthProvider";

export default function ForumsRoute() {
  return (
    <AuthProvider>
      <ForumsPage />
    </AuthProvider>
  );
}
