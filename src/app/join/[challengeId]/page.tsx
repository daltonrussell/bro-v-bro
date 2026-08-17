"use client";

import { useParams, useSearchParams } from "next/navigation";
import { JoinChallengeForm } from "@/components/bro-v-bro/JoinChallengeForm";

export default function JoinPage() {
  const params = useParams<{ challengeId: string }>();
  const invite = useSearchParams().get("invite") ?? "";
  return <JoinChallengeForm challengeId={params.challengeId} inviteToken={invite} />;
}
