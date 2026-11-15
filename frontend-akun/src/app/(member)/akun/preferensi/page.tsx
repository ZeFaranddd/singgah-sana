import type { Metadata } from "next";
import PreferencesPage from "../../../../features/account/PreferencesPage";

export const metadata: Metadata = { title: "Preferensi notifikasi" };

export default function Page() {
  return <PreferencesPage />;
}
