import { ChevronRight, CircleAlert } from "lucide-react";
import Link from "next/link";
import { CARD_TITLE } from "@/components/app/typography";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AttentionItem } from "../lib/attention";

export function AttentionCard({ items }: { items: AttentionItem[] }) {
  if (!items.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className={`${CARD_TITLE} flex items-center gap-2`}>
          <CircleAlert className="size-4" aria-hidden /> Perlu ditindaklanjuti
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y text-sm">
          {items.map((item) => (
            <li key={`${item.kind}-${item.href}`}>
              <Link href={item.href} className="flex min-h-11 items-center justify-between gap-2 py-2">
                <span>{item.label}</span>
                <ChevronRight className="size-4 shrink-0" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
