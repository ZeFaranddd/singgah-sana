import type { Metadata } from "next";
import { RecoverySentPage } from "../../../../features/auth/RecoveryPages";
import { GuestOnly } from "../../../../features/auth/RouteGuards";

export const metadata: Metadata = { title: "Tautan pemulihan terkirim" };

export default function Page() {
  return <GuestOnly><RecoverySentPage /></GuestOnly>;
}
