import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { DashboardClientLayout } from "@/components/layout/dashboard-client-layout";
import { BranchSelectionWrapper } from "@/components/branches/branch-selection-wrapper";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardClientLayout>
      <BranchSelectionWrapper />
      {children}
    </DashboardClientLayout>
  );
}
