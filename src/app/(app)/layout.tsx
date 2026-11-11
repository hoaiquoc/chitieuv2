import { requireUser } from "@/lib/auth";
import { BottomNav } from "@/components/BottomNav";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <>
      <main className="pb-32">{children}</main>
      <BottomNav />
    </>
  );
}
