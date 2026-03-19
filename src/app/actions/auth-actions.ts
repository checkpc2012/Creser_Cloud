
"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { login, logout, getSession, updateSessionData } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function authenticate(state: { error: string } | undefined, payload: FormData) {
  const usuario = (payload.get("usuario") as string)?.trim().toLowerCase();
  const contrasena = payload.get("password") as string;

  // BYPASS LOCAL LOGIN (Solo en desarrollo)
  const isDevelopment = process.env.NODE_ENV !== "production";
  const canBypassFlag = process.env.TESTING_BYPASS_LOGIN === "true";
  const bypassTarget = process.env.TESTING_BYPASS_USER || "admin_local";

  if (isDevelopment && canBypassFlag) {
    const bypassUser = await prisma.user.findUnique({
      where: { username: bypassTarget },
      include: { branch: true }
    });

    if (bypassUser) {
      const mustChangeBypass = process.env.TESTING_BYPASS_FORCE_PASSWORD_CHANGE === "true";
      
      const sessionData = {
        id: bypassUser.id,
        nombre: `${bypassUser.firstName} ${bypassUser.lastName}`,
        usuario: bypassUser.username,
        rol: bypassUser.role,
        assignedBranchId: bypassUser.branchId,
        assignedBranchName: bypassUser.branch?.name || 'Global',
        activeBranchId: bypassUser.branchId,
        activeBranchName: bypassUser.branch?.name || 'Global',
        isTemporaryCoverage: false,
        mustChange: mustChangeBypass ? false : bypassUser.mustChangePassword
      };

      await login(sessionData);
      redirect("/dashboard");
    }
  }

  if (!usuario || !contrasena) {
    return { error: "Usuario y contraseña son requeridos." };
  }

  const user = await prisma.user.findUnique({
    where: { username: usuario },
    include: { branch: true }
  });

  if (!user) {
    return { error: "Credenciales inválidas." };
  }

  if (!user.isActive) {
    return { error: "Cuenta desactivada. Contacte a Soporte." };
  }

  if (user.isBlocked) {
    return { error: "Cuenta bloqueada por múltiples intentos fallidos. Contacte a SYSTEMS." };
  }

  // Use bcryptjs for all verification in Cloud Demo
  let isPassValid = false;
  try {
    isPassValid = await bcrypt.compare(contrasena, user.passwordHash);
  } catch (e) {
    isPassValid = false;
  }

  if (!isPassValid) {
    const newFailedAttempts = user.failedAttempts + 1;
    const shouldBlock = newFailedAttempts >= 5;
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedAttempts: newFailedAttempts,
        isBlocked: shouldBlock
      }
    });

    if (shouldBlock) {
      return { error: "Demasiados intentos fallidos. Su cuenta ha sido bloqueada." };
    }
    return { error: `Contraseña incorrecta. Intentos restantes: ${5 - newFailedAttempts}` };
  }

  // Reset failed attempts on success
  if (user.failedAttempts > 0) {
    await prisma.user.update({ 
      where: { id: user.id }, 
      data: { failedAttempts: 0 } 
    });
  }

  // Check for temporary coverage
  const activeCoverage = await prisma.branchCoverage.findFirst({
    where: {
      userId: user.id,
      isActive: true,
      dateFrom: { lte: new Date() },
      dateTo: { gte: new Date() }
    },
    include: { branch: true }
  });

  // Successful login
  const sessionData = {
    id: user.id,
    nombre: `${user.firstName} ${user.lastName}`,
    usuario: user.username,
    rol: user.role,
    assignedBranchId: user.branchId,
    assignedBranchName: user.branch?.name || 'Global',
    activeBranchId: activeCoverage?.branchId || user.branchId,
    activeBranchName: activeCoverage?.branch?.name || user.branch?.name || 'Global',
    isTemporaryCoverage: !!activeCoverage,
    mustChange: user.mustChangePassword
  };

  await login(sessionData);

  if (user.mustChangePassword) {
    redirect("/dashboard/settings/password");
  } else {
    redirect("/dashboard");
  }
}

export async function getLogout() {
  await logout();
  redirect("/login");
}

export async function changePasswordAction(state: any, formData: FormData) {
  const currentPass = formData.get("currentPassword") as string;
  const newPass = formData.get("newPassword") as string;
  const confirmPass = formData.get("confirmPassword") as string;

  if (newPass !== confirmPass) {
    return { error: "Las contraseñas no coinciden." };
  }

  const session = await getSession();
  if (!session) return { error: "No hay sesión activa." };

  const user = await prisma.user.findUnique({ 
    where: { id: session.user.id },
    include: { branch: true } 
  });
  if (!user) return { error: "Usuario no encontrado." };

  const isMatch = await bcrypt.compare(currentPass, user.passwordHash);

  if (!isMatch) return { error: "La contraseña actual es incorrecta." };

  const lowerNewPass = newPass.toLowerCase();
  
  // Strict proximity check: Reject trivial variants of the temporary password
  if (lowerNewPass.includes("creser")) {
    return { error: "Por seguridad, la contraseña no puede contener variaciones de la contraseña temporal ('creser')." };
  }

  // Strict complexity check: 8+ chars and at least 1 uppercase letter
  if (newPass.length < 8 || !/[A-Z]/.test(newPass)) {
    return { error: "La nueva contraseña debe tener al menos 8 caracteres y 1 letra Mayúscula." };
  }

  const hashed = await bcrypt.hash(newPass, 10);
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashed,
      mustChangePassword: false
    },
    include: { branch: true }
  });

  // Re-login para actualizar la sesión en la cookie
  const sessionData = {
    id: updatedUser.id,
    nombre: `${updatedUser.firstName} ${updatedUser.lastName}`,
    usuario: updatedUser.username,
    rol: updatedUser.role,
    assignedBranchId: updatedUser.branchId,
    assignedBranchName: updatedUser.branch?.name || 'Global',
    activeBranchId: updatedUser.branchId,
    activeBranchName: updatedUser.branch?.name || 'Global',
    mustChange: false
  };

  await login(sessionData);
  redirect("/dashboard");
}

export async function getAuthUserAction() {
  const session = await getSession();
  return session;
}

export async function setActiveBranchAction(branchId: string) {
  const session = await getSession();
  if (!session) return { error: "No session found" };

  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) return { error: "Branch not found" };

  // Verify permission to switch to this branch (Global roles or active coverage)
  const isGlobalRole = ['SYSTEMS', 'OWNER', 'MANAGER', 'ACCOUNTANT'].includes(session.user.rol);
  
  let hasAccess = isGlobalRole;
  if (!hasAccess) {
    const coverage = await prisma.branchCoverage.findFirst({
        where: {
            userId: session.user.id,
            branchId: branchId,
            isActive: true,
            dateFrom: { lte: new Date() },
            dateTo: { gte: new Date() }
        }
    });
    hasAccess = !!coverage || session.user.assignedBranchId === branchId;
  }

  if (!hasAccess) {
    return { error: "No tiene permiso para operar en esta sucursal." };
  }
  
  await updateSessionData({
    user: {
        ...session.user,
        activeBranchId: branchId,
        activeBranchName: branch.name
    }
  });

  return { success: true };
}

// Eliminar bypassLoginAction por seguridad
