import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import {
  Gift,
  Plus,
  Pencil,
  Eye,
  EyeOff,
  Coins,
  Search,
  Trash2,
  Upload,
  Crown,
  Heart,
  Sparkles,
  RefreshCw,
} from "lucide-react";

import { Header } from "@/components/layout/Header";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Switch } from "@/components/ui/switch";

import { Card, CardContent } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { supabase } from "@/integrations/supabase/client";

import {
  listAllGiftsAdmin,
  createGift,
  updateGift,
  deleteGift,
  toggleGift,
  CATEGORY_LABELS,
  RARITY_STYLE,
  type VirtualGift,
  type GiftCategory,
  type GiftRarity,
} from "@/lib/gifts";

export const Route = createFileRoute("/admin/presentes")({
  component: AdminPresentesPage,
});

function AdminPresentesPage() {
  const [gifts, setGifts] = useState<VirtualGift[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedGift, setSelectedGift] = useState<VirtualGift | null>(null);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    slug: "",
    name: "",
    description: "",
    image_url: "",
    emoji: "",
    price_coins: 500,
    category: "romantic" as GiftCategory,
    rarity: "common" as GiftRarity,
    active: true,
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const data = await listAllGiftsAdmin();
      setGifts(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-8 flex items-center justify-between">
          <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 p-8 text-white">
            <h1 className="text-3xl font-bold">🎁 Catálogo de Presentes</h1>

            <p className="text-muted-foreground">Gerencie presentes virtuais da plataforma</p>
          </div>

          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Presente
          </Button>
        </div>

        <div className="mb-6 rounded-3xl border bg-card p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Input placeholder="Nome do presente" />

            <Input placeholder="Emoji" />

            <Input placeholder="Preço" />

            <Button>Salvar Presente</Button>
          </div>
        </div>

        {loading ? (
          <div>Carregando...</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {gifts.map((gift) => (
              <div key={gift.id} className="flex items-center justify-between rounded-3xl border bg-card p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-50 text-3xl">
                    {gift.emoji ?? "🎁"}
                  </div>

                  <div>
                    <h3 className="font-semibold">{gift.name}</h3>

                    <p className="text-sm text-muted-foreground">{gift.description}</p>

                    <div className="mt-2 flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Coins className="h-4 w-4" />
                        {gift.price_coins}
                      </span>

                      <span>{gift.category}</span>

                      <span>{gift.rarity}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {gift.active ? (
                    <Button variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button variant="outline">
                      <EyeOff className="h-4 w-4" />
                    </Button>
                  )}

                  <Button variant="outline">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
