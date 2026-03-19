
import { getAuthUserAction } from "@/app/actions/auth-actions";
import { getBranches } from "@/app/actions/user-actions";
import { BranchSelectionDialog } from "@/components/branches/branch-selection-dialog";

export async function BranchSelectionWrapper() {
  const session = await getAuthUserAction();
  if (!session?.user) return null;

  const isGlobalRole = ["SYSTEMS", "OWNER", "MANAGER", "ACCOUNTANT"].includes(session.user.rol);

  // Only show selection if activeBranchId is missing AND user is not a global role
  if (session.user.activeBranchId || isGlobalRole) return null;

  const branches = await getBranches();

  return <BranchSelectionDialog user={session.user} branches={branches} />;
}

