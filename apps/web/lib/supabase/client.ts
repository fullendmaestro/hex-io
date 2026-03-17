"use client";

import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import { useState, useEffect } from "react";

let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase configuration: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  if (typeof window !== "undefined") {
    supabaseInstance = createBrowserClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name) {
          return document.cookie
            .split("; ")
            .find((row) => row.startsWith(`${name}=`))
            ?.split("=")?.[1];
        },
        set(name, value, options) {
          document.cookie = `${name}=${value}; path=${options?.path ?? "/"}; max-age=${options?.maxAge ?? 31536000}`;
        },
        remove(name, options) {
          document.cookie = `${name}=; path=${options?.path ?? "/"}; max-age=0`;
        },
      },
    });
  } else {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabaseInstance;
}

type User = {
  id: string;
  email: string;
} | null;

export const supabase = getSupabaseClient();

export function useUser() {
  const [user, setUser] = useState<User>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabaseClient = getSupabaseClient();

    const getCurrentUser = async () => {
      try {
        const {
          data: { session },
        } = await supabaseClient.auth.getSession();
        setSession(session);
        setUser(session?.user?.email ? { id: session.user.id, email: session.user.email } : null);
      } catch (error) {
        console.error("Error getting user:", error);
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(
        session?.user?.email
          ? { id: session.user.id, email: session.user.email }
          : null,
      );
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, session, loading };
}
