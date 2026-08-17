"use client";

import { useParams, useSearchParams } from "next/navigation";
import { LiveMatch } from "@/components/bro-v-bro/LiveMatch";

export default function MatchPage() {
  const params = useParams<{ sessionId: string }>();
  const token = useSearchParams().get("token") ?? "";
  return <LiveMatch sessionId={params.sessionId} token={token} />;
}
