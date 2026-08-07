UPDATE public.pet_care_items SET image_url = CASE slug
  WHEN 'fazer-carinho' THEN '/__l5e/assets-v1/39a43d2e-fd93-487e-973f-26e55315bdca/care-fazer-carinho.png'
  WHEN 'cocar-barriga' THEN '/__l5e/assets-v1/45f3aa21-4b31-4d8f-a32d-5c68a7ce79fe/care-cocar-barriga.png'
  WHEN 'cafune' THEN '/__l5e/assets-v1/4738eb3d-f337-4339-bc91-3ab55a6695b8/care-cafune.png'
  WHEN 'abraco' THEN '/__l5e/assets-v1/44486360-c9f7-4915-9b14-953cd4027af1/care-abraco.png'
  WHEN 'beijinho' THEN '/__l5e/assets-v1/8b65eb80-8a67-4791-930b-a9097aa32dc8/care-beijinho.png'
  WHEN 'conversinha' THEN '/__l5e/assets-v1/80e88edc-90e3-42d6-a115-be8cf069334d/care-conversinha.png'
  WHEN 'massagem' THEN '/__l5e/assets-v1/b455e332-430c-4035-bead-7ba043a0665c/care-massagem.png'
  WHEN 'cocegas-orelha' THEN '/__l5e/assets-v1/0c416d87-2666-4b0e-9243-7596eb419950/care-cocegas-orelha.png'
  WHEN 'sessao-fotos' THEN '/__l5e/assets-v1/0910ea96-5b0c-4358-ba62-aab6c9b83b74/care-sessao-fotos.png'
  WHEN 'passeio-leve' THEN '/__l5e/assets-v1/73bd8a08-941a-4162-be27-c01eb41e25c9/care-passeio-leve.png'
  WHEN 'olhar-carinhoso' THEN '/__l5e/assets-v1/3f349a56-0855-4b08-b102-e79c655681e2/care-olhar-carinhoso.png'
END, updated_at = now()
WHERE kind='affection' AND slug IN ('fazer-carinho','cocar-barriga','cafune','abraco','beijinho','conversinha','massagem','cocegas-orelha','sessao-fotos','passeio-leve','olhar-carinhoso');