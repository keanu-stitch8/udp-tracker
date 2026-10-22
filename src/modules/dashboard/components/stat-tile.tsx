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
      <CardContent className="py-3 pr-12">
        <p className={`${LABEL} text-muted-foreground`}>{label}</p>
        <p className={`${AMOUNT} text-lg`}>{value}</p>
      </CardContent>
    </Card>
  );
}
