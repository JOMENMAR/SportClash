import type { APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";
import { createRemoteJWKSet, decodeJwt, jwtVerify } from "jose";

type AuthProvider = "cognito" | "firebase" | "auto";

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getJwks(jwksUrl: string): ReturnType<typeof createRemoteJWKSet> {
  const cached = jwksCache.get(jwksUrl);
  if (cached) return cached;
  const set = createRemoteJWKSet(new URL(jwksUrl));
  jwksCache.set(jwksUrl, set);
  return set;
}

function getAuthProvider(): AuthProvider {
  const v = (process.env.AUTH_PROVIDER || "cognito").toLowerCase();
  if (v === "firebase" || v === "cognito" || v === "auto") return v;
  return "cognito";
}

async function verifyCognitoJwtToUid(token: string): Promise<string> {
  const jwksUrl = process.env.COGNITO_JWKS_URL;
  if (!jwksUrl) throw new Error("missing_jwks");

  const jwks = getJwks(jwksUrl);
  const { payload } = await jwtVerify(token, jwks);

  const sub = payload.sub;
  if (!sub || typeof sub !== "string") throw new Error("invalid_token");
  return sub;
}

async function verifyFirebaseJwtToUid(token: string): Promise<string> {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("missing_firebase_project");

  // Firebase Auth tokens are signed by Google, with a stable JWKS.
  const firebaseJwksUrl =
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

  const jwks = getJwks(firebaseJwksUrl);
  const issuer = `https://securetoken.google.com/${projectId}`;

  const { payload } = await jwtVerify(token, jwks, {
    issuer,
    audience: projectId,
  });

  const sub = payload.sub;
  if (!sub || typeof sub !== "string") throw new Error("invalid_token");
  return sub;
}

function looksLikeFirebase(token: string): boolean {
  try {
    const payload = decodeJwt(token);
    const iss = payload.iss;
    return (
      typeof iss === "string" &&
      iss.startsWith("https://securetoken.google.com/")
    );
  } catch {
    return false;
  }
}

async function verifyJwtToUid(token: string): Promise<string> {
  const provider = getAuthProvider();
  if (provider === "firebase") return verifyFirebaseJwtToUid(token);
  if (provider === "cognito") return verifyCognitoJwtToUid(token);

  // auto
  if (looksLikeFirebase(token)) return verifyFirebaseJwtToUid(token);
  return verifyCognitoJwtToUid(token);
}

export async function getUidFromBearer(event: {
  headers?: Record<string, string | undefined>;
}): Promise<string> {
  const auth = event.headers?.authorization ?? event.headers?.Authorization;
  if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
    throw new Error("missing_auth");
  }

  const token = auth.slice("bearer ".length).trim();
  if (!token) throw new Error("missing_auth");

  return verifyJwtToUid(token);
}

export async function verifyTokenToUid(token: string): Promise<string> {
  if (!token) throw new Error("missing_auth");
  return verifyJwtToUid(token);
}

// helper for local typing in handlers
export type HttpEvent = APIGatewayProxyEventV2WithJWTAuthorizer;
