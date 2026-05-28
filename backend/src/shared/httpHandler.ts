import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyResultV2,
  Context,
} from "aws-lambda";
import { error, json } from "./http.js";

export type AsyncHttpHandler = (
  event: APIGatewayProxyEventV2,
  context: Context,
) => Promise<APIGatewayProxyResultV2>;

export function httpHandler(fn: AsyncHttpHandler): APIGatewayProxyHandlerV2 {
  return async (event, context) => {
    try {
      return await fn(event, context);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);

      if (
        msg === "missing_auth" ||
        msg === "missing_jwks" ||
        msg === "invalid_token"
      ) {
        return error(401, "unauthorized", "No autenticado");
      }
      if (msg === "forbidden") {
        return error(403, "forbidden", "No tienes permisos para esta acción");
      }
      if (msg.startsWith("invalid:")) {
        return error(400, "validation_error", "Datos inválidos", {
          field: msg.slice("invalid:".length),
        });
      }
      if (msg === "not_found") {
        return error(404, "not_found", "No encontrado");
      }
      if (msg === "conflict") {
        return error(409, "conflict", "Conflicto");
      }

      console.error("Unhandled error", {
        msg,
        requestId: context.awsRequestId,
      });
      return json(500, {
        error: { code: "internal_error", message: "Error interno" },
      });
    }
  };
}
