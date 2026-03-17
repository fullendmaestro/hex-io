import { Auth, HTTPException } from "@langchain/langgraph-sdk/auth";
import { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabase-client.js";

const STUDIO_USER_ID = "langgraph-studio-user";

const isStudioUser = (userIdentity: string): boolean => {
  return userIdentity === STUDIO_USER_ID;
};

const createOwnerFilter = (user: { identity: string }) => {
  if (isStudioUser(user.identity)) return;
  return { owner: user.identity };
};

const createWithOwnerMetadata = (value: any, user: { identity: string }) => {
  if (isStudioUser(user.identity)) return;
  value.metadata ??= {};
  value.metadata.owner = user.identity;
  return { owner: user.identity };
};

export const auth = new Auth()
  .authenticate(async (request: Request) => {
    if (request.method === "OPTIONS") {
      return {
        identity: "anonymous",
        permissions: [],
        is_authenticated: false,
        display_name: "CORS Preflight",
      };
    }
    
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      throw new HTTPException(401, { message: "Authorization header missing" });
    }
    
    let token: string | undefined;
    try {
      const parts = authHeader.split(" ");
      if (parts.length !== 2) throw new Error("Invalid format");
      const scheme = parts[0];
      const value = parts[1];
      if (!scheme || scheme.toLowerCase() !== "bearer") throw new Error();
      token = value;
    } catch {
      throw new HTTPException(401, {
        message: "Invalid authorization header format",
      });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new HTTPException(500, {
        message: "Supabase client not initialized",
      });
    }

    let user: User | null = null;
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user) {
        throw new Error(error?.message || "User not found");
      }
      user = data.user;
    } catch (e: any) {
      throw new HTTPException(401, {
        message: `Authentication error: ${e.message}`,
      });
    }

    return {
      identity: user.id,
      permissions: [
        "threads:create",
        "threads:create_run",
        "threads:read",
        "threads:delete",
        "threads:update",
        "threads:search",
        "assistants:create",
        "assistants:read",
        "assistants:delete",
        "assistants:update",
        "assistants:search",
        "deployments:read",
        "deployments:search",
        "store:access",
      ],
    };
  })
  .on("threads:create", ({ value, user }: any) => createWithOwnerMetadata(value, user))
  .on("threads:create_run", ({ value, user }: any) => createWithOwnerMetadata(value, user))
  .on("threads:read", ({ user }: any) => createOwnerFilter(user))
  .on("threads:update", ({ user }: any) => createOwnerFilter(user))
  .on("threads:delete", ({ user }: any) => createOwnerFilter(user))
  .on("threads:search", ({ user }: any) => createOwnerFilter(user))
  .on("assistants:create", ({ value, user }: any) => createWithOwnerMetadata(value, user))
  .on("assistants:read", ({ user }: any) => createOwnerFilter(user))
  .on("assistants:update", ({ user }: any) => createOwnerFilter(user))
  .on("assistants:delete", ({ user }: any) => createOwnerFilter(user))
  .on("assistants:search", ({ user }: any) => createOwnerFilter(user))
  .on("store", ({ user }: any) => ({ owner: user.identity }));
