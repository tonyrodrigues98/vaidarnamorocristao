-- Normalize pet image URLs to plain storage paths so the client can sign them fresh.
-- Strips the public/sign/authenticated URL prefix and any query string.

create or replace function public.__strip_pet_storage_url(v text)
returns text language sql immutable as $$
  select case
    when v is null then null
    when v like 'http%/storage/v1/object/public/pets/%'
      then split_part(substring(v from '/storage/v1/object/public/pets/(.+)$'), '?', 1)
    when v like 'http%/storage/v1/object/sign/pets/%'
      then split_part(substring(v from '/storage/v1/object/sign/pets/(.+)$'), '?', 1)
    when v like 'http%/storage/v1/object/authenticated/pets/%'
      then split_part(substring(v from '/storage/v1/object/authenticated/pets/(.+)$'), '?', 1)
    else split_part(v, '?', 1)
  end;
$$;

update public.pets set image_url = public.__strip_pet_storage_url(image_url)
  where image_url is not null and image_url <> public.__strip_pet_storage_url(image_url);

update public.pets set preview_url = public.__strip_pet_storage_url(preview_url)
  where preview_url is not null and preview_url <> public.__strip_pet_storage_url(preview_url);

update public.pet_categories set image_url = public.__strip_pet_storage_url(image_url)
  where image_url is not null and image_url <> public.__strip_pet_storage_url(image_url);

update public.pet_species set
  image_url = public.__strip_pet_storage_url(image_url),
  image_url_baby = public.__strip_pet_storage_url(image_url_baby),
  image_url_adult = public.__strip_pet_storage_url(image_url_adult);

update public.pet_variants set
  image_url = public.__strip_pet_storage_url(image_url),
  image_url_baby = public.__strip_pet_storage_url(image_url_baby),
  image_url_adult = public.__strip_pet_storage_url(image_url_adult);

update public.pet_life_stages set image_url = public.__strip_pet_storage_url(image_url)
  where image_url is not null and image_url <> public.__strip_pet_storage_url(image_url);

update public.pet_personalities set image_url = public.__strip_pet_storage_url(image_url)
  where image_url is not null and image_url <> public.__strip_pet_storage_url(image_url);

update public.pet_benefits set image_url = public.__strip_pet_storage_url(image_url)
  where image_url is not null and image_url <> public.__strip_pet_storage_url(image_url);

update public.pet_backgrounds set
  image_url_day = public.__strip_pet_storage_url(image_url_day),
  image_url_night = public.__strip_pet_storage_url(image_url_night);

drop function public.__strip_pet_storage_url(text);