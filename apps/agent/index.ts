import { spawn } from "node:child_process";
import { getSupabaseClient } from "./react-agent/security/supabase-client.js";

type AuthenticatedUser = {
  id: string;
  email?: string;
};

const PROXY_PORT = Number(process.env.PORT ?? 2024);
const INTERNAL_LANGGRAPH_PORT = Number(
  process.env.LANGGRAPH_INTERNAL_PORT ?? 8123,
);
const INTERNAL_LANGGRAPH_URL =
  process.env.LANGGRAPH_INTERNAL_URL ??
  `http://127.0.0.1:${INTERNAL_LANGGRAPH_PORT}`;
const SPAWN_LANGGRAPH =
  (process.env.SPAWN_LANGGRAPH_SERVER ?? "true").toLowerCase() !== "false";

const HEALTH_PATHS = new Set(["/", "/ok", "/health", "/health-detailed"]);
const PUBLIC_PATHS = new Set(["/info"]);

let langgraphProcess: ReturnType<typeof spawn> | null = null;

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "access-control-allow-headers": "authorization,content-type,x-api-key",
};

const parseBearerToken = (request: Request): string | null => {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return null;
  return token;
};

const authenticateRequest = async (
  request: Request,
): Promise<AuthenticatedUser | null> => {
  const token = parseBearerToken(request);
  if (!token) return null;

  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Missing Supabase configuration for auth proxy");
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;

  return {
    id: data.user.id,
    email: data.user.email,
  };
};

const stripHopByHopHeaders = (headers: Headers): Headers => {
  const nextHeaders = new Headers(headers);
  const blockedHeaders = [
    "host",
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
    "content-length",
  ];

  for (const header of blockedHeaders) {
    nextHeaders.delete(header);
  }

  return nextHeaders;
};

const forwardToLangGraph = async (
  request: Request,
  user: AuthenticatedUser | null,
) => {
  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(
    `${INTERNAL_LANGGRAPH_URL}${incomingUrl.pathname}${incomingUrl.search}`,
  );

  const headers = stripHopByHopHeaders(request.headers);
  if (user) {
    headers.set("x-authenticated-user-id", user.id);
    if (user.email) headers.set("x-authenticated-user-email", user.email);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : request.body,
    redirect: "follow",
  };

  const upstreamResponse = await fetch(targetUrl, init);
  const responseHeaders = stripHopByHopHeaders(upstreamResponse.headers);
  Object.entries(corsHeaders).forEach(([key, value]) =>
    responseHeaders.set(key, value),
  );

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
};

const startLangGraphServer = () => {
  if (!SPAWN_LANGGRAPH) {
    console.log(
      "[proxy] SPAWN_LANGGRAPH_SERVER=false, expecting LangGraph server to already be running",
    );
    return;
  }

  langgraphProcess = spawn(
    "bunx",
    [
      "langgraphjs",
      "dev",
      "--port",
      String(INTERNAL_LANGGRAPH_PORT),
      "--config",
      "./langgraph.json",
    ],
    {
      stdio: "inherit",
      shell: true,
    },
  );

  langgraphProcess.on("exit", (code, signal) => {
    console.log(
      `[proxy] internal LangGraph server exited (code=${code}, signal=${signal})`,
    );
    process.exit(code ?? 0);
  });
};

const shutdown = () => {
  if (langgraphProcess && !langgraphProcess.killed) {
    langgraphProcess.kill();
  }
  process.exit(0);
};

startLangGraphServer();

Bun.serve({
  port: PROXY_PORT,
  async fetch(request: Request) {
    const pathname = new URL(request.url).pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (HEALTH_PATHS.has(pathname)) {
      return new Response(
        JSON.stringify({
          status: "ok",
          service: "agent-auth-proxy",
          proxy_port: PROXY_PORT,
          internal_langgraph_url: INTERNAL_LANGGRAPH_URL,
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }

    try {
      const user = await authenticateRequest(request);
      if (!user && !PUBLIC_PATHS.has(pathname)) {
        return new Response(
          JSON.stringify({ detail: "Invalid or missing bearer token" }),
          {
            status: 401,
            headers: {
              "content-type": "application/json",
              ...corsHeaders,
            },
          },
        );
      }

      return await forwardToLangGraph(request, user);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown proxy error";
      return new Response(JSON.stringify({ detail: message }), {
        status: 500,
        headers: {
          "content-type": "application/json",
          ...corsHeaders,
        },
      });
    }
  },
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log(`[proxy] listening on http://localhost:${PROXY_PORT}`);
console.log(`[proxy] forwarding to ${INTERNAL_LANGGRAPH_URL}`);
