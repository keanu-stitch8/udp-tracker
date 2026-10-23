"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CARD_TITLE } from "@/components/app/typography";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDeleteDivision, useDivisions } from "../hooks/use-divisions";
import { DivisionForm } from "./division-form";
import { DivisionPms } from "./division-pms";

type Editing = { kind: "new" } | { kind: "rename"; id: string } | null;

export function DivisionSettings() {
  const { data: divisions = [] } = useDivisions();
  const [editing, setEditing] = useState<Editing>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const remove = useDeleteDivision();
  const done = () => setEditing(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => setEditing({ kind: "new" })}>
          + Divisi
        </Button>
      </div>
      {editing?.kind === "new" && (
        <Card>
          <CardContent>
            <DivisionForm onDone={done} />
          </CardContent>
        </Card>
      )}
      {divisions.map((division) => (
        <Card key={division.id}>
          <CardHeader>
            {editing?.kind === "rename" && editing.id === division.id ? (
              <DivisionForm initial={division} onDone={done} />
            ) : (
              <>
                <CardTitle className={CARD_TITLE}>{division.name}</CardTitle>
                <CardDescription>{division.projectCount} proyek</CardDescription>
                <CardAction className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setEditing({ kind: "rename", id: division.id })}>
                    Ubah
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(division.id)}>
                    Hapus
                  </Button>
                </CardAction>
              </>
            )}
          </CardHeader>
          {editing?.kind !== "rename" || editing.id !== division.id ? (
            <CardContent>
              <DivisionPms division={division} />
            </CardContent>
          ) : null}
          {confirmDelete === division.id && (
            <CardContent>
              <div className="flex flex-col gap-2 border-2 p-3 text-sm">
                {division.projectCount > 0 ? (
                  <p>
                    Divisi {division.name} masih berisi {division.projectCount} proyek. Pindahkan proyeknya ke divisi lain lewat Pengaturan proyek dulu.
                  </p>
                ) : (
                  <p>Hapus divisi {division.name}?</p>
                )}
                <div className="flex gap-2">
                  {division.projectCount === 0 && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      disabled={remove.isPending}
                      onClick={() =>
                        remove.mutate(division.id, {
                          onSuccess: () => {
                            toast("Divisi dihapus.");
                            setConfirmDelete(null);
                          },
                          onError: (error) => toast.error(error.message),
                        })
                      }
                    >
                      Ya, hapus
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setConfirmDelete(null)}>
                    {division.projectCount > 0 ? "Tutup" : "Batal"}
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
