create table if not exists catris_scores (
  id            serial primary key,
  handle        text not null,
  wallet        text,
  score         integer not null,
  lines         integer not null default 0,
  specials      integer not null default 0,
  duration_ms   integer not null default 0,
  season        integer not null default 1,
  created_at    timestamptz not null default now()
);

create index if not exists catris_scores_score_idx on catris_scores (score desc, created_at desc);
create index if not exists catris_scores_season_idx on catris_scores (season, score desc);

create table if not exists catris_seasons (
  id            serial primary key,
  season        integer not null unique,
  title         text not null,
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  prize_note    text not null default 'Arena pot from the 3% creator tax'
);
