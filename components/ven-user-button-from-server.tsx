import { VenUserButton } from "@/components/ven-user-button";
import { getVenUserButtonProfileMode } from "@/lib/ven-role.server";

export async function VenUserButtonFromServer() {
  const profileMode = await getVenUserButtonProfileMode();
  return <VenUserButton profileMode={profileMode} />;
}
