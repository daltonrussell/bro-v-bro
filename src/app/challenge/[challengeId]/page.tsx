"use client";

import { useParams, useSearchParams } from "next/navigation";
import { ChallengeLobby } from "@/components/bro-v-bro/ChallengeLobby";

export default function ChallengePage() {
  const params = useParams<{ challengeId: string }>();
  const search = useSearchParams();
  const token = search.get("token") ?? "";
  return <ChallengeLobby challengeId={params.challengeId} token={token} />;
}
