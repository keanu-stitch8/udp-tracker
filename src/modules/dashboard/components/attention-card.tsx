import { ChevronRight, CircleAlert, HandCoins, ReceiptText, Scale, TrendingDown, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { CARD_TITLE } from "@/components/app/typography";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Item, ItemActions, ItemContent, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import type { AttentionItem } from "../lib/attention";

const ICONS: Record<AttentionItem["kind"], LucideIcon> = {
  receipt: ReceiptText,
  difference: Scale,
  negative: TrendingDown,
  reimburse: HandCoins,
};

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
        <ItemGroup className="gap-2">
          {items.map((item) => {
            const Icon = ICONS[item.kind];
            return (
              <Item key={`${item.kind}-${item.href}`} variant="outline" size="sm" className="min-h-11" render={<Link href={item.href} />}>
                <ItemMedia variant="icon">
                  <Icon aria-hidden />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{item.label}</ItemTitle>
                </ItemContent>
                <ItemActions>
                  <ChevronRight className="size-4" aria-hidden />
                </ItemActions>
              </Item>
            );
          })}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
