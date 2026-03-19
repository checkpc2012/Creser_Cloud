import { Role } from "../generated/client";

export type PermissionAction =
    | "LOAN_CREATE"
    | "LOAN_DELETE"
    | "LOAN_REFY"
    | "CLIENT_CREATE"
    | "CLIENT_EDIT"
    | "USER_MANAGE"
    | "BILLING_MANAGE"
    | "REPORTS_VIEW"
    | "SETTINGS_MANAGE";

const ROLE_PERMISSIONS: Record<Role, PermissionAction[]> = {
    SYSTEMS: [
        "LOAN_CREATE", "LOAN_DELETE", "LOAN_REFY", "CLIENT_CREATE", "CLIENT_EDIT",
        "USER_MANAGE", "BILLING_MANAGE", "REPORTS_VIEW", "SETTINGS_MANAGE"
    ],
    OWNER: [
        "LOAN_CREATE", "LOAN_DELETE", "LOAN_REFY", "CLIENT_CREATE", "CLIENT_EDIT",
        "USER_MANAGE", "BILLING_MANAGE", "REPORTS_VIEW", "SETTINGS_MANAGE"
    ],
    MANAGER: [
        "LOAN_CREATE", "LOAN_REFY", "CLIENT_CREATE", "CLIENT_EDIT",
        "BILLING_MANAGE", "REPORTS_VIEW"
    ],
    ACCOUNTANT: [
        "BILLING_MANAGE", "REPORTS_VIEW"
    ],
    AGENT_SENIOR: [
        "LOAN_CREATE", "LOAN_REFY", "CLIENT_CREATE", "CLIENT_EDIT"
    ],
    AGENT: [
        "LOAN_CREATE", "CLIENT_CREATE"
    ]
};

export function hasPermission(userRole: Role, action: PermissionAction): boolean {
    return ROLE_PERMISSIONS[userRole]?.includes(action) ?? false;
}

export function canAccessPath(userRole: Role, path: string): boolean {
    if (path.startsWith("/dashboard/users") || path.startsWith("/dashboard/settings")) {
        return ["SYSTEMS", "OWNER"].includes(userRole);
    }
    if (path.startsWith("/dashboard/billing")) {
        return ["SYSTEMS", "OWNER", "MANAGER", "ACCOUNTANT"].includes(userRole);
    }
    if (path.startsWith("/dashboard/reports")) {
        return ["SYSTEMS", "OWNER", "MANAGER", "ACCOUNTANT"].includes(userRole);
    }
    return true;
}
