import type { Metadata } from "next";
import { RestrictedPage } from "../../../features/auth/StatusPages";

export const metadata: Metadata = { title: "Akses akun dibatasi" };

export default function Page() {
  return <RestrictedPage />;
}
