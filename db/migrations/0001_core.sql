-- Minimal relational model for the friend-vs-friend MVP.
-- PostgreSQL 16+ compatible.

create table users (
  id uuid primary key,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table provider_identities (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  provider text not null,
  provider_user_id text not null,
  created_at timestamptz not null default now(),
  unique (provider, provider_user_id)
);

create table games (
  id text primary key,
  name text not null,
  source text not null,
  external_id text,
  launch_url text,
  artwork_url text,
  active boolean not null default true
);

create table challenges (
  id uuid primary key,
  host_user_id uuid not null references users(id),
  opponent_user_id uuid references users(id),
  first_to integer not null check (first_to > 0),
  status text not null,
  invite_token_hash text,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create table challenge_game_pool (
  challenge_id uuid not null references challenges(id) on delete cascade,
  game_id text not null references games(id),
  primary key (challenge_id, game_id)
);

create table gauntlet_sessions (
  id uuid primary key,
  challenge_id uuid not null unique references challenges(id),
  status text not null,
  version integer not null default 1,
  selector_user_id uuid references users(id),
  current_game_id text references games(id),
  player_a_user_id uuid not null references users(id),
  player_b_user_id uuid not null references users(id),
  player_a_score integer not null default 0,
  player_b_score integer not null default 0,
  first_to integer not null,
  winner_user_id uuid references users(id),
  started_at timestamptz,
  completed_at timestamptz
);

create table round_results (
  id uuid primary key,
  session_id uuid not null references gauntlet_sessions(id) on delete cascade,
  round_number integer not null,
  game_id text not null references games(id),
  selected_by_user_id uuid not null references users(id),
  reported_winner_user_id uuid not null references users(id),
  reported_by_user_id uuid not null references users(id),
  confirmed_by_user_id uuid references users(id),
  status text not null,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unique (session_id, round_number),
  unique (session_id, game_id)
);

create table discord_match_bindings (
  session_id uuid primary key references gauntlet_sessions(id) on delete cascade,
  guild_id text,
  channel_id text not null,
  message_id text not null,
  created_at timestamptz not null default now()
);
