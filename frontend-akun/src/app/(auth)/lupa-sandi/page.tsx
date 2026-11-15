import type { Metadata } from "next";
import { ForgotPasswordPage } from "../../../features/auth/RecoveryPages";
import { GuestOnly } from "../../../features/auth/RouteGuards";

export const metadata: Metadata = { title: "Lupa kata sandi" };

export default function Page() {
  return <GuestOnly><ForgotPasswordPage /></GuestOnly>;
}
