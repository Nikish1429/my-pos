"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getSupabase } from "./supabase";
import { useRouter, usePathname } from "next/navigation";

type UserRole = "admin" | "cashier" | null;

type AuthContextType = {
  user: any | null;
  role: UserRole;
  userName: string | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  userName: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // 1. Check active session
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          // Fetch role from users table by email
          const { data: profile } = await supabase
            .from("users")
            .select("role, name")
            .eq("email", session.user.email)
            .single();

          if (profile) {
            setRole(profile.role as UserRole);
            setUserName(profile.name);
          }
        } else {
          setUser(null);
          setRole(null);
          setUserName(null);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          const { data: profile } = await supabase
            .from("users")
            .select("role, name")
            .eq("email", session.user.email)
            .single();

          if (profile) {
            setRole(profile.role as UserRole);
            setUserName(profile.name);
          }
        } else {
          setUser(null);
          setRole(null);
          setUserName(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 3. Page guards
  useEffect(() => {
    if (loading) return;

    // Redirect to login if not authenticated and not on login page
    if (!user && pathname !== "/login") {
      router.push("/login");
    }

    // Redirect cashier away from inventory
    if (user && role === "cashier" && pathname === "/inventory") {
      router.push("/");
    }
  }, [user, role, loading, pathname, router]);

  const logout = async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
      setUser(null);
      setRole(null);
      setUserName(null);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, userName, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
