import Link from "next/link";
import { Suspense } from "react";
import { PAGE_TITLE } from "@/components/app/typography";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectListSection } from "../sections/project-list-section";

export function ProjectListView() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className={PAGE_TITLE}>Proyek</h1>
        <Link href="/proyek/baru" className={buttonVariants({ size: "sm" })}>
          + Proyek baru
        </Link>
      </div>
      <Suspense fallback={<Skeleton className="h-24 w-full" />}>
        <ProjectListSection />
      </Suspense>
    </div>
  );
}
