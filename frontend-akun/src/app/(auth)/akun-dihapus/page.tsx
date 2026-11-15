import type { Metadata } from "next";
import { AccountDeletedPage } from "../../../features/auth/StatusPages";

export const metadata: Metadata = { title: "Akun dihapus" };

export default function Page() {
  return <AccountDeletedPage />;
}
