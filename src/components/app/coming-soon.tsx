import { Construction } from "lucide-react";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

/** Layar yang dibangun di rencana berikutnya (Rencana 2: buku kas). */
export function ComingSoon({ title }: { title: string }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia>
          <Construction className="size-8" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>Segera hadir.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
