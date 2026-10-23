"use client";

import Link from "next/link";
import { AppSelect } from "@/components/app/app-select";
import { useDivisions } from "../hooks/use-divisions";

/** Pilihan divisi untuk form proyek: hanya divisi tempat user boleh membuat proyek. Di-prefetch oleh section pemanggil. */
export function DivisionSelect({ id, value, onChange }: { id: string; value: string; onChange: (divisionId: string) => void }) {
  const { data = [] } = useDivisions();
  const divisions = data.filter((d) => d.canCreateProject);
  if (!divisions.length) {
    return (
      <p className="text-sm">
        Belum ada divisi.{" "}
        <Link href="/lainnya/divisi" className="underline">
          Buat divisi dulu
        </Link>
        .
      </p>
    );
  }
  return <AppSelect id={id} label="Divisi" value={value} items={divisions.map((d) => ({ value: d.id, label: d.name }))} onChange={onChange} />;
}
