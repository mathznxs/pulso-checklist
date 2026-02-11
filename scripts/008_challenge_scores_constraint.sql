-- Ensure unique constraint on challenge_scores for upsert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'challenge_scores_challenge_id_user_id_key'
  ) THEN
    ALTER TABLE public.challenge_scores
      ADD CONSTRAINT challenge_scores_challenge_id_user_id_key
      UNIQUE (challenge_id, user_id);
  END IF;
END;
$$;
