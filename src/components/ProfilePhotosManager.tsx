import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Photo {
  id: string;
  url: string;
  sort_order: number;
}

const MAX = 6;

export function ProfilePhotosManager({ userId }: { userId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("profile_photos")
      .select("id, url, sort_order")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setPhotos((data ?? []) as Photo[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (photos.length >= MAX) {
      toast.error(`Máximo de ${MAX} fotos adicionais`);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Foto até 5MB");
      return;
    }
    setUploading(true);
    // Verificação por IA antes de subir
    const { verifyProfilePhoto } = await import("@/lib/verifyPhoto");
    const verdict = await verifyProfilePhoto(file);
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
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/extra-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("profile-photos")
      .upload(path, file, { upsert: false, contentType: file.type });
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
    void load();
  };

  const remove = async (photo: Photo) => {
    const { error } = await supabase.from("profile_photos").delete().eq("id", photo.id);
    if (error) {
      toast.error("Não foi possível remover");
      return;
    }
    // try to remove storage object (best-effort)
    const marker = "/profile-photos/";
    const idx = photo.url.indexOf(marker);
    if (idx > -1) {
      const path = photo.url.substring(idx + marker.length).split("?")[0];
      void supabase.storage.from("profile-photos").remove([path]);
    }
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
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
        <span className="text-xs text-muted-foreground">{photos.length}/{MAX}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {photos.map((p) => (
          <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl border bg-muted">
            <img src={p.url} alt="" className="h-full w-full object-cover" loading="lazy" />
            <button
              type="button"
              onClick={() => remove(p)}
              className="absolute right-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition group-hover:opacity-100 active:scale-95"
              aria-label="Remover foto"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {photos.length < MAX && !loading && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[var(--rose-soft)] bg-card/60 text-muted-foreground transition hover:border-[var(--rose)] hover:text-[var(--rose)]">
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
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
              disabled={uploading}
            />
          </label>
        )}
      </div>
    </div>
  );
}