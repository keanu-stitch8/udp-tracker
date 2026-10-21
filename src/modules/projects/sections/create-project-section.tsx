import { connection } from "next/server";
import { todayWib } from "@/modules/shared/lib/date";
import { ProjectForm } from "../components/project-form";

export async function CreateProjectSection() {
  await connection();
  return <ProjectForm today={todayWib()} />;
}
