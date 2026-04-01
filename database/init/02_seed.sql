-- =============================================================
-- Seed Data (development only)
-- =============================================================

INSERT INTO users (id, github_login, name, avatar_url, friend_approval_required) VALUES
  ('00000000-0000-0000-0000-000000000001', 'octocat',  'The Octocat',    'https://avatars.githubusercontent.com/u/583231',  0),
  ('00000000-0000-0000-0000-000000000002', 'torvalds', 'Linus Torvalds', 'https://avatars.githubusercontent.com/u/1024025', 1),
  ('00000000-0000-0000-0000-000000000003', 'gvanrossum','Guido van Rossum','https://avatars.githubusercontent.com/u/2894642',0);

INSERT INTO characters (id, github_login, skill_impl, skill_planning, skill_speed, tech_primary, tech_all, tendency, deck_score) VALUES
  ('00000000-0000-0000-0001-000000000001', 'octocat',   72, 45, 60, '["TypeScript","Go"]',     '["TypeScript","Go","Python","Shell"]', 'implementation', 95),
  ('00000000-0000-0000-0001-000000000002', 'torvalds',  95, 30, 88, '["C","Shell"]',           '["C","Shell","Makefile"]',            'implementation', 120),
  ('00000000-0000-0000-0001-000000000003', 'gvanrossum',60, 80, 50, '["Python","C"]',          '["Python","C","Shell"]',              'planning',       85);

INSERT INTO decks (id, owner_login, deck_score, is_registered, registered_at) VALUES
  ('00000000-0000-0000-0002-000000000001', 'octocat',   95,  1, '2025-01-01 00:00:00'),
  ('00000000-0000-0000-0002-000000000002', 'torvalds',  120, 1, '2025-01-01 00:00:00');

INSERT INTO deck_members (deck_id, member_login, position) VALUES
  ('00000000-0000-0000-0002-000000000001', 'octocat',   1),
  ('00000000-0000-0000-0002-000000000001', 'torvalds',  2),
  ('00000000-0000-0000-0002-000000000002', 'torvalds',  1),
  ('00000000-0000-0000-0002-000000000002', 'gvanrossum',2);

INSERT INTO friends (requester_login, requestee_login, status) VALUES
  ('octocat', 'torvalds',  'accepted'),
  ('octocat', 'gvanrossum','accepted');
