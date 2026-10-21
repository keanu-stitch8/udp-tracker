import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectListSection } from "../sections/project-list-section";

export function ProjectListView() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
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
