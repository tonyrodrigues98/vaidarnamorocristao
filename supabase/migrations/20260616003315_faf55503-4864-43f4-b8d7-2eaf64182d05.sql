UPDATE public.pet_random_events
SET base_chance = LEAST(0.30, base_chance * 3),
    daily_cap = GREATEST(daily_cap, 5)
WHERE active = true;

INSERT INTO public.pet_random_events (kind, scope, base_chance, daily_cap, personality_id, personality_chance_mult, payload, sort_order, active)
VALUES
  ('affection', 'kind', 0.08, 6,
   (SELECT id FROM public.pet_personalities WHERE name = 'Carinhoso'),
   3.00,
   '{"type":"coins","min":1,"max":3,"label":"Gratidão recompensada"}'::jsonb,
   10, true),
  ('feed', 'kind', 0.10, 5,
   (SELECT id FROM public.pet_personalities WHERE name = 'Guloso'),
   2.50,
   '{"type":"coins","min":2,"max":6,"label":"Refeição da sorte"}'::jsonb,
   11, true),
  ('play', 'kind', 0.06, 4,
   (SELECT id FROM public.pet_personalities WHERE name = 'Travesso'),
   2.00,
   '{"type":"buff","kind":"affection","duration_min":45,"mult":1.25,"label":"Animado demais!"}'::jsonb,
   12, true);
