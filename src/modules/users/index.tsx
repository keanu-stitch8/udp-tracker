import { UserAdminView } from "./views/user-admin-view";

export { AccountGateSection } from "./sections/account-gate-section";
export { HeaderAvatarSection } from "./sections/header-avatar-section";
export { ViewAsBannerSection } from "./sections/view-as-banner-section";

export function UserAdminModule() {
  return <UserAdminView />;
}
