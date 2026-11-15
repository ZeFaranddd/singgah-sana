import type { ReactNode } from "react";
import { MemberLayout } from "../../components/layout/RouteLayouts";

export default function Layout({ children }: { children: ReactNode }) {
  return <MemberLayout>{children}</MemberLayout>;
}
