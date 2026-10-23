import { WalletMinimal } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";

/** Pengganti form transaksi bila user tidak boleh mencatat/mengubah (spec pemegang dompet). */
export function NoAccessNotice({ message, returnTo }: { message: string; returnTo: string }) {
  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <WalletMinimal />
        <AlertTitle>Tidak bisa mencatat di sini</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      <Link href={returnTo} className={buttonVariants({ variant: "outline" })}>
        Kembali
      </Link>
    </div>
  );
}
