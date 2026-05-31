"use client";

import OnboardingFlow from "@/app/components/OnboardingFlow";
import AuthProvider from "@/app/components/AuthProvider";

export default function OnboardingPage() {
  return (
    <AuthProvider>
      <OnboardingFlow />
    </AuthProvider>
  );
}
