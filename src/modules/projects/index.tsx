import { CreateProjectView } from "./views/create-project-view";
import { ProjectListView } from "./views/project-list-view";
import { ProjectSettingsView } from "./views/project-settings-view";

export { ProjectHeaderSection } from "./sections/project-header-section";

export function ProjectListModule() {
  return <ProjectListView />;
}

export function CreateProjectModule() {
  return <CreateProjectView />;
}

export function ProjectSettingsModule() {
  return <ProjectSettingsView />;
}
