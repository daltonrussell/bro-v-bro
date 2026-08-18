import { randomUUID } from "node:crypto";
import { createSession } from "@/modules/gauntlet/domain/session";
import type { GauntletSessionRepository } from "@/modules/gauntlet/application/session-repository";
import { demoChallengePresets, formatChallengeSelection, getRuleVariant } from "@/modules/catalog/domain/challenge-preset";
import type { MatchPoolSource } from "@/modules/catalog/domain/match-pool";
import { demoTemplates } from "@/modules/catalog/domain/template";
import {
  acceptProposal,
  addPoolItem,
  addProposal,
  applyTemplate,
  assertStartable,
  changePoolRules,
  dismissProposal,
  removePoolItem,
  setGuestVeto,
  setReady,
} from "../domain/setup";
import type { Challenge, PoolProposal } from "../domain/types";
import { SqliteChallengeRepository } from "../infrastructure/sqlite-challenge-repository";
import { newToken } from "../infrastructure/token";

export type ChallengeViewerRole = "host" | "guest" | "invitee";

export type ChallengeCommand =
  | { type: "apply-template"; templateId: string }
  | { type: "add"; presetId: string; ruleVariantId?: string; source?: MatchPoolSource }
  | { type: "remove"; presetId: string }
  | { type: "change-rules"; presetId: string; ruleVariantId: string }
  | { type: "suggest-add"; presetId: string; ruleVariantId?: string }
  | { type: "suggest-rules"; presetId: string; ruleVariantId: string }
  | { type: "accept-proposal"; proposalId: string }
  | { type: "dismiss-proposal"; proposalId: string }
  | { type: "veto"; presetId: string; vetoed: boolean }
  | { type: "ready"; ready: boolean }
  | { type: "start" };

export class ChallengeService {
  constructor(
    private readonly challenges: SqliteChallengeRepository,
    private readonly sessions: GauntletSessionRepository,
  ) {}

  create(input: { hostName: string; firstTo: number }) {
    if (!input.hostName.trim()) throw new Error("Host name is required");
    if (input.firstTo < 1 || input.firstTo > 9) throw new Error("firstTo must be between 1 and 9");

    const id = randomUUID();
    const hostToken = newToken();
    const inviteToken = newToken();
    const challenge: Challenge = {
      id,
      hostName: input.hostName.trim(),
      opponentName: null,
      firstTo: input.firstTo,
      pool: [],
      proposals: [],
      sourceTemplateId: null,
      hostReady: false,
      guestReady: false,
      version: 1,
      status: "waiting-for-opponent",
      sessionId: null,
      createdAt: new Date().toISOString(),
    };
    this.challenges.create({ ...challenge, hostToken, inviteToken });
    return { challenge, hostToken, inviteToken };
  }

  join(input: { challengeId: string; inviteToken: string; opponentName: string }) {
    const challenge = this.requireChallenge(input.challengeId);
    if (!this.challenges.verifyInvite(input.challengeId, input.inviteToken)) throw new Error("Invite is invalid");
    if (challenge.opponentName || challenge.sessionId) throw new Error("Challenge has already been joined");
    if (!input.opponentName.trim()) throw new Error("Opponent name is required");

    const opponentToken = newToken();
    this.challenges.join(challenge.id, input.opponentName.trim(), opponentToken);
    const next: Challenge = {
      ...challenge,
      opponentName: input.opponentName.trim(),
      status: "configuring",
      version: challenge.version + 1,
    };
    this.challenges.saveSetup(next, challenge.version);
    return { challenge: next, opponentToken };
  }

  resolveViewer(challengeId: string, token: string): ChallengeViewerRole | null {
    if (this.challenges.verifyHost(challengeId, token)) return "host";
    if (this.challenges.verifyOpponent(challengeId, token)) return "guest";
    if (this.challenges.verifyInvite(challengeId, token)) return "invitee";
    return null;
  }

  async command(input: { challengeId: string; token: string; command: ChallengeCommand }) {
    const challenge = this.requireChallenge(input.challengeId);
    const role = this.resolveViewer(input.challengeId, input.token);
    if (!role || role === "invitee") throw new Error("Participant token required");

    if (input.command.type === "start") {
      if (role !== "host") throw new Error("Only the host can start the Bro v Bro");
      if (challenge.sessionId) return { challenge, sessionId: challenge.sessionId };
      const next = await this.start(challenge);
      return { challenge: next, sessionId: next.sessionId };
    }
    if (challenge.status === "started") throw new Error("Challenge has already started");

    let next = challenge;
    switch (input.command.type) {
      case "apply-template": {
        this.assertHost(role);
        const template = demoTemplates.find((candidate) => candidate.id === input.command.templateId);
        if (!template) throw new Error(`Unknown template ${input.command.templateId}`);
        next = applyTemplate(challenge, template, demoChallengePresets);
        break;
      }
      case "add": {
        this.assertHost(role);
        const preset = this.preset(input.command.presetId);
        this.assertGameNotAlreadyRepresented(challenge, preset.id, preset.gameId);
        next = addPoolItem(challenge, preset, input.command.source ?? "search", input.command.ruleVariantId);
        break;
      }
      case "remove":
        this.assertHost(role);
        next = removePoolItem(challenge, input.command.presetId);
        break;
      case "change-rules": {
        this.assertHost(role);
        next = changePoolRules(challenge, this.preset(input.command.presetId), input.command.ruleVariantId);
        break;
      }
      case "suggest-add": {
        this.assertGuest(role);
        const preset = this.preset(input.command.presetId);
        this.assertGameNotAlreadyRepresented(challenge, preset.id, preset.gameId);
        const ruleVariantId = input.command.ruleVariantId ?? preset.defaultRuleVariantId;
        getRuleVariant(preset, ruleVariantId);
        next = addProposal(challenge, this.proposal("add-challenge", preset.id, ruleVariantId));
        break;
      }
      case "suggest-rules": {
        this.assertGuest(role);
        const preset = this.preset(input.command.presetId);
        getRuleVariant(preset, input.command.ruleVariantId);
        if (!challenge.pool.some((item) => item.presetId === preset.id)) throw new Error("Challenge is not in the pool");
        next = addProposal(challenge, this.proposal("change-rules", preset.id, input.command.ruleVariantId));
        break;
      }
      case "accept-proposal":
        this.assertHost(role);
        next = acceptProposal(challenge, input.command.proposalId, demoChallengePresets);
        break;
      case "dismiss-proposal":
        this.assertHost(role);
        next = dismissProposal(challenge, input.command.proposalId);
        break;
      case "veto":
        this.assertGuest(role);
        next = setGuestVeto(challenge, input.command.presetId, input.command.vetoed);
        break;
      case "ready":
        next = setReady(challenge, role, input.command.ready);
        break;
    }

    if (next !== challenge) this.challenges.saveSetup(next, challenge.version);
    return { challenge: next };
  }

  private async start(challenge: Challenge): Promise<Challenge> {
    assertStartable(challenge);
    if (!challenge.opponentName) throw new Error("Opponent has not joined");

    const selections = challenge.pool.map((item) => {
      const preset = this.preset(item.presetId);
      return {
        gameId: preset.gameId,
        presetId: preset.id,
        ruleVariantId: item.ruleVariantId,
        label: formatChallengeSelection(preset, item.ruleVariantId),
      };
    });
    const uniqueGameIds = new Set(selections.map((selection) => selection.gameId));
    if (uniqueGameIds.size !== selections.length) throw new Error("Only one challenge per game is supported for now");

    const sessionId = randomUUID();
    const session = createSession({
      id: sessionId,
      firstTo: challenge.firstTo,
      eligibleGameIds: selections.map((selection) => selection.gameId),
      challengeSelections: selections,
      playerAName: challenge.hostName,
      playerBName: challenge.opponentName,
    });
    await this.sessions.create(session);
    this.challenges.attachSession(challenge.id, sessionId);
    this.challenges.bindSessionAccessFromChallenge(challenge.id, sessionId);

    const next: Challenge = {
      ...challenge,
      sessionId,
      status: "started",
      version: challenge.version + 1,
    };
    this.challenges.saveSetup(next, challenge.version);
    return next;
  }

  private requireChallenge(id: string): Challenge {
    const challenge = this.challenges.get(id);
    if (!challenge) throw new Error("Challenge not found");
    return challenge;
  }

  private preset(id: string) {
    const preset = demoChallengePresets.find((candidate) => candidate.id === id);
    if (!preset) throw new Error(`Unknown challenge preset ${id}`);
    return preset;
  }

  private proposal(type: PoolProposal["type"], presetId: string, ruleVariantId: string): PoolProposal {
    return { id: randomUUID(), type, presetId, ruleVariantId, createdAt: new Date().toISOString() } as PoolProposal;
  }

  private assertGameNotAlreadyRepresented(challenge: Challenge, presetId: string, gameId: string) {
    const duplicate = challenge.pool.some((item) => {
      if (item.presetId === presetId) return false;
      return this.preset(item.presetId).gameId === gameId;
    });
    if (duplicate) throw new Error("That game is already represented in the pool");
  }

  private assertHost(role: ChallengeViewerRole): asserts role is "host" {
    if (role !== "host") throw new Error("Only the host can change the match pool");
  }

  private assertGuest(role: ChallengeViewerRole): asserts role is "guest" {
    if (role !== "guest") throw new Error("Only the guest can make this request");
  }
}
