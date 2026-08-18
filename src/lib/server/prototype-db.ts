import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

type GlobalWithDb = typeof globalThis & { __broVBROPrototypeDb?: DatabaseSync };

export function prototypeDb(): DatabaseSync {
  const target = globalThis as GlobalWithDb;
  if (target.__broVBROPrototypeDb) return target.__broVBROPrototypeDb;

  const filePath = process.env.BVB_DEV_DB_PATH ?? path.join(process.cwd(), ".data", "bro-v-bro.sqlite");
  mkdirSync(path.dirname(filePath), { recursive: true });
  const db = new DatabaseSync(filePath);
  db.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;");
  db.exec(`
    create table if not exists prototype_sessions (
      id text primary key,
      version integer not null,
      payload text not null,
      created_at text not null default current_timestamp,
      updated_at text not null default current_timestamp
    );
    create table if not exists prototype_commands (
      session_id text not null,
      idempotency_key text not null,
      created_at text not null default current_timestamp,
      primary key (session_id, idempotency_key)
    );
    create table if not exists prototype_challenges (
      id text primary key,
      host_name text not null,
      host_token_hash text not null,
      invite_token_hash text not null,
      opponent_name text,
      opponent_token_hash text,
      first_to integer not null,
      game_ids_json text not null,
      session_id text,
      created_at text not null default current_timestamp
    );
    create table if not exists prototype_challenge_setup (
      challenge_id text primary key,
      version integer not null,
      payload text not null,
      updated_at text not null default current_timestamp,
      foreign key (challenge_id) references prototype_challenges(id) on delete cascade
    );
    create table if not exists prototype_session_access (
      session_id text not null,
      player_id text not null,
      token_hash text not null,
      primary key (session_id, player_id),
      unique (session_id, token_hash)
    );
    create table if not exists prototype_steam_link_states (
      state text primary key,
      challenge_id text not null,
      role text not null,
      participant_token text not null,
      expires_at integer not null,
      foreign key (challenge_id) references prototype_challenges(id) on delete cascade
    );
    create table if not exists prototype_steam_connections (
      challenge_id text not null,
      role text not null,
      steam_id text not null,
      persona_name text not null,
      avatar_url text,
      profile_url text,
      library_status text not null,
      games_json text not null,
      synced_at text not null,
      primary key (challenge_id, role),
      foreign key (challenge_id) references prototype_challenges(id) on delete cascade
    );
  `);
  target.__broVBROPrototypeDb = db;
  return db;
}
