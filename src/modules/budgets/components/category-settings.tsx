"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CategoryIcon } from "@/components/app/category-icon";
import { CARD_TITLE } from "@/components/app/typography";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CategoryIconName } from "@/modules/shared/types/category-icons";
import type { CategoryKind } from "@/modules/shared/types/enums";
import { useCategorySettings, useSaveCategory } from "../hooks/use-categories";
import type { CategorySetting } from "../queries/category-settings";
import { CategoryForm } from "./category-form";

const SECTIONS: { kind: CategoryKind; title: string }[] = [
  { kind: "expense", title: "Pengeluaran" },
  { kind: "income", title: "Pemasukan" },
];

type Editing = { kind: "new"; categoryKind: CategoryKind } | { kind: "edit"; id: string } | null;

export function CategorySettingsList({ projectId }: { projectId: string }) {
  const { data } = useCategorySettings(projectId);
  const [editing, setEditing] = useState<Editing>(null);
  const [showArchived, setShowArchived] = useState(false);
  if (!data) return null;
  const archived = data.categories.filter((c) => c.archived);

  const renderItem = (category: CategorySetting) =>
    editing?.kind === "edit" && editing.id === category.id ? (
      <li key={category.id} className="py-3">
        <CategoryForm projectId={projectId} defaultKind={category.kind} initial={category} onDone={() => setEditing(null)} />
      </li>
    ) : (
      <CategoryItem key={category.id} projectId={projectId} category={category} locked={data.locked} onEdit={() => setEditing({ kind: "edit", id: category.id })} />
    );

  return (
    <div className="flex flex-col gap-4">
      {data.locked && (
        <Alert>
          <AlertTitle>Proyek sudah selesai</AlertTitle>
          <AlertDescription>Kategori dikunci. Buka kembali proyek untuk mengubah.</AlertDescription>
        </Alert>
      )}
      {SECTIONS.map(({ kind, title }) => (
        <Card key={kind}>
          <CardHeader>
            <CardTitle className={CARD_TITLE}>{title}</CardTitle>
            <CardAction>
              <Button size="sm" variant="outline" disabled={data.locked} onClick={() => setEditing({ kind: "new", categoryKind: kind })}>
                + Tambah
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {editing?.kind === "new" && editing.categoryKind === kind && (
              <div className="mb-3 border-2 p-3">
                <CategoryForm projectId={projectId} defaultKind={kind} onDone={() => setEditing(null)} />
              </div>
            )}
            <ul className="divide-y">{data.categories.filter((c) => c.kind === kind && !c.archived).map(renderItem)}</ul>
          </CardContent>
        </Card>
      ))}
      {archived.length > 0 && (
        <>
          <Button variant="ghost" className="self-start" onClick={() => setShowArchived((v) => !v)}>
            {showArchived ? "Sembunyikan" : "Tampilkan"} kategori diarsipkan ({archived.length})
          </Button>
          {showArchived && (
            <Card>
              <CardContent>
                <ul className="divide-y">{archived.map(renderItem)}</ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function CategoryItem({ projectId, category, locked, onEdit }: { projectId: string; category: CategorySetting; locked: boolean; onEdit: () => void }) {
  const save = useSaveCategory(projectId, category.id);
  const system = category.isAdminFee || category.isOfficeFunding;
  const detail = [
    category.isVehicleRelated && "terkait mobil",
    category.isAdminFee && "biaya admin otomatis",
    category.isOfficeFunding && "UDP kantor",
    category.usedCount > 0 && `${category.usedCount} transaksi`,
    category.budgetNames.length > 0 && `pagu: ${category.budgetNames.join(", ")}`,
  ]
    .filter(Boolean)
    .join(" · ");

  function toggleArchived() {
    const archived = !category.archived;
    save.mutate(
      { kind: category.kind, name: category.name, icon: category.icon as CategoryIconName, isVehicleRelated: category.isVehicleRelated, archived },
      {
        onSuccess: () => toast(archived ? `${category.name} diarsipkan. Tidak muncul lagi di form transaksi.` : `${category.name} diaktifkan lagi.`),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <li className="flex items-center gap-3 py-2">
      <span className="flex size-9 shrink-0 items-center justify-center border-2 bg-accent">
        <CategoryIcon name={category.icon} className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{category.name}</p>
        {detail && <p className="truncate text-xs text-muted-foreground">{detail}</p>}
      </div>
      <Button size="sm" variant="outline" disabled={locked} onClick={onEdit}>
        Ubah
      </Button>
      <Button size="sm" variant="ghost" disabled={locked || save.isPending || (system && !category.archived)} onClick={toggleArchived}>
        {category.archived ? "Aktifkan" : "Arsipkan"}
      </Button>
    </li>
  );
}
