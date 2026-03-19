"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";
import { getAuthUserAction } from "@/app/actions/auth-actions";

interface User {
  id: string;
  name: string;
  role: string;
  username: string;
  branch?: string;
  activeBranchId?: string;
  activeBranchName?: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    async function loadSession() {
      const session = await getAuthUserAction();
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.nombre,
          role: session.user.rol, // The session object mapping from auth-actions
          username: session.user.usuario,
          branch: session.user.activeBranchName,
          activeBranchId: session.user.activeBranchId,
          activeBranchName: session.user.activeBranchName
        });
      } else {
        setUser(null);
      }
    }
    loadSession();
  }, [pathname]);

  const login = (userData: any) => {
    setUser({
      id: userData.id,
      name: userData.nombre,
      role: userData.rol,
      username: userData.usuario,
      branch: userData.activeBranchName,
      activeBranchId: userData.activeBranchId,
      activeBranchName: userData.activeBranchName
    });
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
