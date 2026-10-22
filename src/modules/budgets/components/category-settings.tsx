"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AppSelect } from "@/components/app/app-select";
import { CategoryIcon } from "@/components/app/category-icon";
import { CARD_TITLE, LABEL } from "@/components/app/typography";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api-client";
import type { CategoryIconName } from "@/modules/shared/types/category-icons";
import type { CategoryKind } from "@/modules/shared/types/enums";
import { useCategorySettings, useDeleteCategoryGroup, useSaveCategory } from "../hooks/use-categories";
import { groupCategories } from "../lib/category-groups";
import type { CategorySetting } from "../queries/category-settings";
import { CategoryForm } from "./category-form";
import { CategoryGroupForm } from "./category-group-form";

type Editing =
  | { kind: "new"; categoryKind: CategoryKind; groupId?: string }
  | { kind: "edit"; id: string }
  | { kind: "new-group" }
  | { kind: "rename-group"; id: string }
  | null;

export function CategorySettingsList({ projectId }: { projectId: string }) {
  const { data } = useCategorySettings(projectId);
  const [editing, setEditing] = useState<Editing>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [moveTo, setMoveTo] = useState("");
  const removeGroup = useDeleteCategoryGroup(projectId);
  if (!data) return null;
  const archived = data.categories.filter((c) => c.archived);
  const active = data.categories.filter((c) => !c.archived);
  const sections = groupCategories(data.groups, active, { keepEmpty: true });
  const done = () => setEditing(null);

  const renderItem = (category: CategorySetting) =>
    editing?.kind === "edit" && editing.id === category.id ? (
      <li key={category.id} className="py-3">
        <CategoryForm projectId={projectId} defaultKind={category.kind} groups={data.groups} initial={category} onDone={done} />
      </li>
    ) : (
      <CategoryItem key={category.id} projectId={projectId} category={category} locked={data.locked} onEdit={() => setEditing({ kind: "edit", id: category.id })} />
    );

  const newForm = (categoryKind: CategoryKind, groupId?: string) =>
    editing?.kind === "new" && editing.categoryKind === categoryKind && editing.groupId === groupId ? (
      <div className="mb-3 border-2 p-3">
        <CategoryForm projectId={projectId} defaultKind={categoryKind} groups={data.groups} defaultGroupId={groupId} onDone={done} />
      </div>
    ) : null;

  function askDelete(id: string | null) {
    setConfirmDelete(id);
    setMoveTo("");
  }

  function deleteGroup(id: string) {
    removeGroup.mutate(
      { groupId: id, moveTo: moveTo || undefined },
      {
        onSuccess: () => {
          toast("Grup dihapus.");
          askDelete(null);
        },
        onError: (error) => toast.error(error instanceof ApiError ? (error.fieldErrors.moveTo?.[0] ?? error.message) : error.message),
      },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {data.locked && (
        <Alert>
          <AlertTitle>Proyek sudah selesai</AlertTitle>
          <AlertDescription>Kategori dikunci. Buka kembali proyek untuk mengubah.</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between gap-2">
        <h2 className={LABEL}>Pengeluaran</h2>
        <Button size="sm" variant="outline" disabled={data.locked} onClick={() => setEditing({ kind: "new-group" })}>
          + Grup
        </Button>
      </div>
      {editing?.kind === "new-group" && (
        <Card>
          <CardContent>
            <CategoryGroupForm projectId={projectId} onDone={done} />
          </CardContent>
        </Card>
      )}
      {sections.map(({ group, categories }) => {
        const count = data.groups.find((g) => g.id === group.id)?.categoryCount ?? 0;
        return (
          <Card key={group.id}>
            <CardHeader>
              {editing?.kind === "rename-group" && editing.id === group.id ? (
                <CategoryGroupForm projectId={projectId} initial={group} onDone={done} />
              ) : (
                <>
                  <CardTitle className={CARD_TITLE}>{group.name}</CardTitle>
                  <CardAction className="flex gap-1">
                    <Button size="sm" variant="outline" disabled={data.locked} onClick={() => setEditing({ kind: "new", categoryKind: "expense", groupId: group.id })}>
                      + Tambah
                    </Button>
                    <Button size="sm" variant="ghost" disabled={data.locked} onClick={() => setEditing({ kind: "rename-group", id: group.id })}>
                      Ubah
                    </Button>
                    <Button size="sm" variant="ghost" disabled={data.locked} onClick={() => askDelete(group.id)}>
                      Hapus
                    </Button>
                  </CardAction>
                </>
              )}
            </CardHeader>
            <CardContent>
              {confirmDelete === group.id && (
                <div className="mb-3 flex flex-col gap-2 border-2 p-3 text-sm">
                  {count > 0 ? (
                    <>
                      <p>
                        Grup {group.name} berisi {count} kategori. Pindahkan ke grup:
                      </p>
                      <AppSelect
                        label="Grup tujuan"
                        value={moveTo}
                        items={[{ value: "", label: "Pilih grup" }, ...data.groups.filter((g) => g.id !== group.id).map((g) => ({ value: g.id, label: g.name }))]}
                        onChange={setMoveTo}
                      />
                    </>
                  ) : (
                    <p>Hapus grup {group.name}?</p>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" variant="destructive" className="flex-1" disabled={removeGroup.isPending || (count > 0 && !moveTo)} onClick={() => deleteGroup(group.id)}>
                      {count > 0 ? "Pindahkan & hapus" : "Ya, hapus"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => askDelete(null)}>
                      Batal
                    </Button>
                  </div>
                </div>
              )}
              {newForm("expense", group.id)}
              {categories.length ? <ul className="divide-y">{categories.map(renderItem)}</ul> : <p className="text-sm text-muted-foreground">Belum ada kategori.</p>}
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardHeader>
          <CardTitle className={CARD_TITLE}>Pemasukan</CardTitle>
          <CardAction>
            <Button size="sm" variant="outline" disabled={data.locked} onClick={() => setEditing({ kind: "new", categoryKind: "income" })}>
              + Tambah
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {newForm("income")}
          <ul className="divide-y">{active.filter((c) => c.kind === "income").map(renderItem)}</ul>
        </CardContent>
      </Card>

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
      { kind: category.kind, name: category.name, icon: category.icon as CategoryIconName, isVehicleRelated: category.isVehicleRelated, archived, groupId: category.groupId },
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
