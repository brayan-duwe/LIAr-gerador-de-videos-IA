-- Execute este SQL no Supabase Dashboard > SQL Editor

-- Tabela de histórico de vídeos gerados
CREATE TABLE IF NOT EXISTS public.videos (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt      text NOT NULL,
  image_url   text,
  video_url   text,
  duracao     text,
  qualidade   text,
  fps         text,
  status      text DEFAULT 'pending',   -- pending | completed | failed
  created_at  timestamptz DEFAULT now() NOT NULL
);

-- Habilita RLS (Row Level Security)
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Política: cada usuário só vê seus próprios vídeos
CREATE POLICY "Usuário vê seus vídeos"
  ON public.videos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário insere seus vídeos"
  ON public.videos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário atualiza seus vídeos"
  ON public.videos FOR UPDATE
  USING (auth.uid() = user_id);
