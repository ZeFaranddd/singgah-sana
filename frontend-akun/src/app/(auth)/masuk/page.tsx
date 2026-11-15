import type { Metadata } from "next";
import LoginPage from "../../../features/auth/LoginPage";
import { GuestOnly } from "../../../features/auth/RouteGuards";

export const metadata: Metadata = { title: "Masuk" };

export default function Page() {
  return <GuestOnly><LoginPage /></GuestOnly>;
}
