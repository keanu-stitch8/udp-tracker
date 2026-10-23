import { connection } from "next/server";
import { getDb } from "@/db/client";
import { ViewAsBanner } from "../components/view-as-banner";
import { getViewAs } from "../queries/current-user";

export async function ViewAsBannerSection() {
  await connection();
  const viewAs = await getViewAs(getDb());
  return viewAs ? <ViewAsBanner name={viewAs.target.name ?? viewAs.target.email} /> : null;
}
