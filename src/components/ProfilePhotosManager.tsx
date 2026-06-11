import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, WifiOff } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PhotoImg } from "@/components/PhotoImg";
import { normalizeImageFile } from "@/lib/imageNormalize";
import { extractProfilePhotoPath } from "@/lib/photoUrl";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { StaleDataNotice } from "@/components/ui/StaleDataNotice";
import { OfflineState } from "@/components/ui/OfflineState";

interface Photo {
  id: string;
  url: string;
  sort_order: number;
}

const MAX = 6;

export function ProfilePhotosManager({ userId }: { userId: string }) {
  const { isOnline } = useNetworkStatus();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const photosQuery = useQuery({
    queryKey: ["profile-photos", userId],
    enabled: !!userId,
    staleTime: 60_000,
    gcTime: 30 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_photos")
        .select("id, url, sort_order")
        .eq("user_id", userId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Photo[];
    },
  });

  const photos: Photo[] = photosQuery.data ?? [];
  const loading = photosQuery.isLoading;
  const refetchPhotos = () =>
    qc.invalidateQueries({ queryKey: ["profile-photos", userId] });

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!isOnline) {
      toast.error("Disponível online. Reconecte-se para enviar fotos.");
      return;
    }
    if (photos.length >= MAX) {
      toast.error(`Máximo de ${MAX} fotos adicionais`);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Foto muito grande (máx. 10MB).");
      return;
    }
    setUploading(true);
    const t = toast.loading("Preparando foto...");
    let normalized = file;
    try {
      normalized = await normalizeImageFile(file);
    } finally {
      toast.dismiss(t);
    }
    if (normalized.size > 8 * 1024 * 1024) {
      setUploading(false);
      toast.error("Foto até 8MB após conversão. Tente uma imagem menor.");
      return;
    }
    // Verificação por IA antes de subir
    const { verifyProfilePhoto } = await import("@/lib/verifyPhoto");
    const verdict = await verifyProfilePhoto(normalized, "extra");
    if (!verdict.ok) {
      setUploading(false);
      toast.error(verdict.reason);
      return;
    }
    let aiVerified = false;
    let aiConfidence: number | null = null;
    let needsReview = false;
    let aiReason = "";
    if ("soft" in verdict && verdict.soft) {
      // ok
    } else if (verdict.approved) {
      aiVerified = true;
      aiConfidence = verdict.confidence;
    } else if (verdict.needsReview) {
      needsReview = true;
      aiConfidence = verdict.confidence;
      aiReason = verdict.reason;
    }
    const ext = normalized.name.split(".").pop() ?? "jpg";
    const path = `${userId}/extra-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("profile-photos")
      .upload(path, normalized, { upsert: false, contentType: normalized.type || "image/jpeg" });
    if (upErr) {
      setUploading(false);
      toast.error("Falha ao enviar foto");
      return;
    }
    const { data: pub } = supabase.storage.from("profile-photos").getPublicUrl(path);
    const url = pub.publicUrl;
    const nextOrder = photos.length ? Math.max(...photos.map((p) => p.sort_order)) + 1 : 0;
    const { data: inserted, error } = await supabase
      .from("profile_photos")
      .insert({
        user_id: userId,
        url,
        sort_order: nextOrder,
        ai_verified: aiVerified,
        ai_confidence: aiConfidence,
        ai_checked_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    setUploading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Backfill photo_url no log de moderação mais recente (criado pela API antes do upload)
    try {
      const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: logRows } = await supabase
        .from("photo_moderation_log")
        .select("id")
        .eq("user_id", userId)
        .eq("scope", "extra")
        .is("photo_url", null)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1);
      const logId = logRows?.[0]?.id;
      if (logId) {
        await supabase.from("photo_moderation_log").update({ photo_url: url }).eq("id", logId);
      }
    } catch (e) {
      console.warn("backfill log url failed", e);
    }
    if (needsReview) {
      await supabase.from("photo_moderation_queue").insert({
        user_id: userId,
        photo_url: url,
        scope: "extra",
        photo_id: inserted?.id ?? null,
        ai_result: { confidence: aiConfidence, reason: aiReason },
        status: "pending",
      });
      toast.message("Foto enviada para análise rápida da equipe.");
    }
    toast.success("Foto adicionada");
    void refetchPhotos();
  };

  const remove = async (photo: Photo) => {
    if (!isOnline) {
      toast.error("Disponível online. Reconecte-se para remover fotos.");
      return;
    }
    const { error } = await supabase.from("profile_photos").delete().eq("id", photo.id);
    if (error) {
      toast.error("Não foi possível remover");
      return;
    }
    // try to remove storage object (best-effort)
    const path = extractProfilePhotoPath(photo.url);
    if (path) {
      void supabase.storage.from("profile-photos").remove([path]);
    }
    void refetchPhotos();
    toast.success("Foto removida");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Fotos adicionais</h3>
          <p className="text-xs text-muted-foreground">
            Até {MAX} fotos opcionais que aparecerão no carrossel do seu card.
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          {photos.length}/{MAX}
        </span>
      </div>
      {!isOnline && photos.length > 0 && (
        <StaleDataNotice message="Você está offline. Mostrando fotos carregadas anteriormente." />
      )}
      {!isOnline && photos.length === 0 && !loading && (
        <OfflineState
          compact
          title="Fotos indisponíveis offline"
          description="Conecte-se para carregar suas fotos."
        />
      )}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {photos.map((p) => (
          <div
            key={p.id}
            className="group relative aspect-square overflow-hidden rounded-xl border bg-muted"
          >
            <PhotoImg src={p.url} alt="" className="h-full w-full object-cover" loading="lazy" />
            <button
              type="button"
              onClick={() => remove(p)}
              disabled={!isOnline}
              title={!isOnline ? "Disponível online. Reconecte-se para remover fotos." : undefined}
              className="absolute right-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition group-hover:opacity-100 active:scale-95 disabled:opacity-40"
              aria-label="Remover foto"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {photos.length < MAX && !loading && (
          <label
            aria-disabled={!isOnline}
            title={!isOnline ? "Disponível online. Reconecte-se para enviar fotos." : undefined}
            className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[var(--rose-soft)] bg-card/60 text-muted-foreground transition ${
              !isOnline
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer hover:border-[var(--rose)] hover:text-[var(--rose)]"
            }`}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : !isOnline ? (
              <>
                <WifiOff className="h-5 w-5" />
                <span className="text-[11px]">Offline</span>
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                <span className="text-[11px]">Adicionar</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onUpload}
              disabled={uploading || !isOnline}
            />
          </label>
        )}
      </div>
    </div>
  );
}
