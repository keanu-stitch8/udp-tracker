import type { LucideIcon } from "lucide-react";
import { AMOUNT, LABEL } from "@/components/app/typography";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Kartu angka dengan kotak ikon berwarna di pojok kanan atas (gaya Brutadmin). `tone` = kelas bg-*. */
export function StatTile({ label, value, icon: Icon, tone }: { label: string; value: string; icon: LucideIcon; tone: string }) {
  return (
    <Card className="relative overflow-hidden">
      <span className={cn("absolute top-0 right-0 flex size-10 items-center justify-center border-b-2 border-l-2", tone)}>
        <Icon className="size-5" aria-hidden />
      </span>
      {/* Hanya label yang memberi ruang kotak ikon; nominal di bawah kotak ikon (mt-3), selebar kartu, tetap satu baris (font mengecil di kartu sempit). */}
      <CardContent className="@container py-3">
        <p className={`${LABEL} pr-10 text-muted-foreground`}>{label}</p>
        <p className={`${AMOUNT} mt-3 text-[min(1.125rem,11.5cqi)] whitespace-nowrap`}>{value}</p>
      </CardContent>
    </Card>
  );
}
