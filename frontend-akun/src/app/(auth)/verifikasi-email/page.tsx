import type { Metadata } from "next";
import { VerifyEmailPendingPage } from "../../../features/auth/RecoveryPages";
import { MemberOnly } from "../../../features/auth/RouteGuards";

export const metadata: Metadata = { title: "Verifikasi email" };

export default function Page() {
  return <MemberOnly><VerifyEmailPendingPage /></MemberOnly>;
}
