"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { CARD_TITLE } from "@/components/app/typography";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import type { UserOption } from "../types/user-list";
import { UserAvatar } from "./user-avatar";

/** Drawer pilih satu orang dari pool user aktif, dengan pencarian nama/email. */
export function UserPicker({
  open,
  title,
  description,
  options,
  onPick,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  options: UserOption[];
  onPick: (user: UserOption) => void;
  onClose: () => void;
}) {
  return (
    <Drawer open={open} onOpenChange={(next) => !next && onClose()}>
      <DrawerContent className="mx-auto max-w-[480px]">
        <DrawerHeader>
          <DrawerTitle className={CARD_TITLE}>{title}</DrawerTitle>
          {description && <DrawerDescription>{description}</DrawerDescription>}
        </DrawerHeader>
        {open && <PickerList options={options} onPick={onPick} />}
      </DrawerContent>
    </Drawer>
  );
}

function PickerList({ options, onPick }: { options: UserOption[]; onPick: (user: UserOption) => void }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q ? options.filter((u) => `${u.name ?? ""} ${u.email}`.toLowerCase().includes(q)) : options;
  return (
    <div className="flex flex-col gap-3 px-4 pb-6">
      <Input aria-label="Cari nama atau email" placeholder="Cari nama atau email" className="h-10" value={query} onChange={(e) => setQuery(e.target.value)} />
      <ItemGroup className="max-h-[50dvh] gap-2 overflow-y-auto">
        {shown.length === 0 && <p className="text-sm text-muted-foreground">{options.length ? "Tidak ada yang cocok." : "Semua pengguna aktif sudah ditambahkan."}</p>}
        {shown.map((user) => (
          <Item key={user.id} variant="outline" size="sm" className="bg-card">
            <ItemMedia>
              <UserAvatar name={user.name} email={user.email} imageUrl={user.imageUrl} className="size-8" />
            </ItemMedia>
            <ItemContent className="min-w-0">
              <ItemTitle className="w-full truncate">{user.name ?? user.email}</ItemTitle>
              {user.name && <ItemDescription className="truncate">{user.email}</ItemDescription>}
            </ItemContent>
            <ItemActions>
              <Button size="icon-lg" aria-label={`Tambahkan ${user.name ?? user.email}`} onClick={() => onPick(user)}>
                <Plus className="size-6" strokeWidth={3} />
              </Button>
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
    </div>
  );
}
