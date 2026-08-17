import type { ChallengePreset } from "../../catalog/domain/challenge-preset.ts";
import { getRuleVariant } from "../../catalog/domain/challenge-preset.ts";
import type { MatchPoolSource } from "../../catalog/domain/match-pool.ts";
import type { Challenge, ChallengePoolItem, PoolProposal } from "./types.ts";

export class ChallengeSetupError extends Error {}

export function maximumRounds(firstTo: number): number {
  return firstTo * 2 - 1;
}

export function addPoolItem(
  challenge: Challenge,
  preset: ChallengePreset,
  source: MatchPoolSource = "suggestion",
  ruleVariantId = preset.defaultRuleVariantId,
): Challenge {
  getRuleVariant(preset, ruleVariantId);
  if (challenge.pool.some((item) => item.presetId === preset.id)) return challenge;
  return configurationChanged(challenge, {
    pool: [...challenge.pool, { presetId: preset.id, ruleVariantId, source, guestVetoed: false }],
  });
}

export function removePoolItem(challenge: Challenge, presetId: string): Challenge {
  if (!challenge.pool.some((item) => item.presetId === presetId)) return challenge;
  return configurationChanged(challenge, {
    pool: challenge.pool.filter((item) => item.presetId !== presetId),
    proposals: challenge.proposals.filter((proposal) => proposal.presetId !== presetId),
  });
}

export function changePoolRules(
  challenge: Challenge,
  preset: ChallengePreset,
  ruleVariantId: string,
): Challenge {
  getRuleVariant(preset, ruleVariantId);
  const item = challenge.pool.find((candidate) => candidate.presetId === preset.id);
  if (!item) throw new ChallengeSetupError(`Challenge ${preset.id} is not in the pool`);
  if (item.ruleVariantId === ruleVariantId) return challenge;
  return configurationChanged(challenge, {
    pool: challenge.pool.map((candidate) => candidate.presetId === preset.id
      ? { ...candidate, ruleVariantId }
      : candidate),
  });
}

export function setGuestVeto(challenge: Challenge, presetId: string, guestVetoed: boolean): Challenge {
  const item = challenge.pool.find((candidate) => candidate.presetId === presetId);
  if (!item) throw new ChallengeSetupError(`Challenge ${presetId} is not in the pool`);
  if (item.guestVetoed === guestVetoed) return challenge;
  return configurationChanged(challenge, {
    pool: challenge.pool.map((candidate) => candidate.presetId === presetId
      ? { ...candidate, guestVetoed }
      : candidate),
  });
}

export function addProposal(challenge: Challenge, proposal: PoolProposal): Challenge {
  if (challenge.proposals.some((candidate) => candidate.id === proposal.id)) return challenge;
  const duplicate = challenge.proposals.some((candidate) =>
    candidate.type === proposal.type
      && candidate.presetId === proposal.presetId
      && candidate.ruleVariantId === proposal.ruleVariantId,
  );
  if (duplicate) return challenge;
  return bump(challenge, { proposals: [...challenge.proposals, proposal] });
}

export function dismissProposal(challenge: Challenge, proposalId: string): Challenge {
  if (!challenge.proposals.some((candidate) => candidate.id === proposalId)) return challenge;
  return bump(challenge, { proposals: challenge.proposals.filter((candidate) => candidate.id !== proposalId) });
}

export function acceptProposal(
  challenge: Challenge,
  proposalId: string,
  presets: readonly ChallengePreset[],
): Challenge {
  const proposal = challenge.proposals.find((candidate) => candidate.id === proposalId);
  if (!proposal) throw new ChallengeSetupError("Proposal not found");
  const preset = presets.find((candidate) => candidate.id === proposal.presetId);
  if (!preset) throw new ChallengeSetupError(`Unknown challenge preset ${proposal.presetId}`);

  const withoutProposal = { ...challenge, proposals: challenge.proposals.filter((candidate) => candidate.id !== proposalId) };
  if (proposal.type === "add-challenge") {
    return addPoolItem(withoutProposal, preset, "suggestion", proposal.ruleVariantId);
  }
  return changePoolRules(withoutProposal, preset, proposal.ruleVariantId);
}

export function setReady(challenge: Challenge, role: "host" | "guest", ready: boolean): Challenge {
  if (role === "guest" && !challenge.opponentName) throw new ChallengeSetupError("Opponent has not joined");
  if (ready && challenge.pool.some((item) => item.guestVetoed)) {
    throw new ChallengeSetupError("Resolve vetoed challenges before readying up");
  }
  return bump(challenge, role === "host" ? { hostReady: ready } : { guestReady: ready });
}

export function assertStartable(challenge: Challenge): void {
  if (!challenge.opponentName) throw new ChallengeSetupError("Opponent has not joined");
  if (!challenge.hostReady || !challenge.guestReady) throw new ChallengeSetupError("Both players must be ready");
  if (challenge.pool.some((item) => item.guestVetoed)) throw new ChallengeSetupError("Resolve all vetoes before starting");
  const required = maximumRounds(challenge.firstTo);
  if (challenge.pool.length < required) {
    throw new ChallengeSetupError(`Add at least ${required} challenges for a no-repeat first-to-${challenge.firstTo}`);
  }
}

export function poolItemForPreset(challenge: Challenge, presetId: string): ChallengePoolItem | undefined {
  return challenge.pool.find((item) => item.presetId === presetId);
}

function configurationChanged(
  challenge: Challenge,
  patch: Partial<Pick<Challenge, "pool" | "proposals">>,
): Challenge {
  return bump(challenge, { ...patch, hostReady: false, guestReady: false });
}

function bump(challenge: Challenge, patch: Partial<Challenge>): Challenge {
  return { ...challenge, ...patch, version: challenge.version + 1 };
}
