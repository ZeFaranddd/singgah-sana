import type { Metadata } from "next";
import { EmailVerifiedPage } from "../../../../features/auth/RecoveryPages";
import { MemberOnly } from "../../../../features/auth/RouteGuards";

export const metadata: Metadata = { title: "Email terverifikasi" };

export default function Page() {
  return <MemberOnly><EmailVerifiedPage /></MemberOnly>;
}
