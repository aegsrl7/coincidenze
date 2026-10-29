-- COINCIDENZE — Migration 0013
-- La pagina Team diventa Organizzazione: le persone sono gli utenti del sito, più chi non ha un
-- accesso (team_members senza user_id, per esempio volontari). I compiti si assegnano a un utente
-- (assignee_user_id) oppure a una persona senza accesso (assignee_id), mai a entrambi.
-- Applicare in produzione PRIMA del deploy del codice che la usa.

ALTER TABLE team_members ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN assignee_user_id TEXT REFERENCES users(id) ON DELETE SET NULL;

-- Collega chi era già nel team al suo utente: stesso nome, oppure stesso nome di battesimo
-- ("Marco" e "Marco Salzotto"), solo se l'utente è uno solo
UPDATE team_members SET user_id = (
    SELECT u.id FROM users u
    WHERE lower(trim(u.name)) = lower(trim(team_members.name)) OR lower(trim(u.name)) LIKE lower(trim(team_members.name)) || ' %'
  )
  WHERE user_id IS NULL AND (
    SELECT count(*) FROM users u
    WHERE lower(trim(u.name)) = lower(trim(team_members.name)) OR lower(trim(u.name)) LIKE lower(trim(team_members.name)) || ' %'
  ) = 1;

-- I compiti di chi ora ha un utente passano all'utente
UPDATE tasks SET assignee_user_id = (SELECT tm.user_id FROM team_members tm WHERE tm.id = tasks.assignee_id), assignee_id = NULL
  WHERE assignee_id IN (SELECT id FROM team_members WHERE user_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_tasks_assignee_user ON tasks(assignee_user_id);
