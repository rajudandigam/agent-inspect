/**
 * URL-aware redaction for http(s) and common connection-string schemes.
 *
 * Keeps scheme, host and path so two attempts of the same step stay
 * comparable, and removes credentials carried in userinfo, query params and
 * fragment params. Identifier-looking path segments are masked on http(s)
 * when the profile redacts identifiers. Connection URIs only strip userinfo
 * and sensitive params so database/queue paths stay intact.
 *
 * Mirrors `packages/redact/src/url-redaction.ts`. Keep both copies in sync.
 */

import { isCredentialSensitiveKey } from "./sensitive-key.js";

export interface UrlRedactionOptions {
  /** Field names the active profile redacts, used for query and fragment params. */
  sensitiveKeys: readonly string[];
  /** Value-level credential check, usually the profile's detectors. */
  isSensitiveValue: (value: string) => boolean;
  replacement?: string;
  /** Mask identifier-looking path segments (share and strict profiles, http(s) only). */
  maskPathIds?: boolean;
  idPlaceholder?: string;
}

export interface UrlRedactionResult {
  value: string;
  credentialRedacted: boolean;
  identifiersMasked: boolean;
}

const HTTP_URL = /^https?:\/\/[^\s]+$/i;

/** Connection schemes common in agent tool attributes (DB, cache, queue). */
const CONNECTION_PROTOCOLS = new Set([
  "postgres:",
  "postgresql:",
  "mysql:",
  "mariadb:",
  "mongodb:",
  "mongodb+srv:",
  "redis:",
  "rediss:",
  "amqp:",
  "amqps:",
]);

const CONNECTION_URI =
  /^(?:postgres|postgresql|mysql|mariadb|mongodb(?:\+srv)?|rediss?|amqps?):\/\/[^\s]+$/i;

const UUID_SEGMENT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX_SEGMENT = /^[0-9a-f]{12,}$/i;
const NUMERIC_SEGMENT = /^\d{5,}$/;
const OPAQUE_SEGMENT = /^[A-Za-z0-9_-]{20,}$/;

/** True when the whole string is a single http(s) URL. */
export function looksLikeHttpUrl(value: string): boolean {
  return HTTP_URL.test(value.trim());
}

/** True when the whole string is a known connection URI with a scheme:// authority. */
export function looksLikeConnectionUri(value: string): boolean {
  return CONNECTION_URI.test(value.trim());
}

/** True when the value is eligible for URL-aware rewrite (http(s) or connection URI). */
export function looksLikeUrlForRedaction(value: string): boolean {
  return looksLikeHttpUrl(value) || looksLikeConnectionUri(value);
}

function parseRedactableUrl(value: string): URL | undefined {
  try {
    const url = new URL(value.trim());
    if (url.protocol === "http:" || url.protocol === "https:") return url;
    if (CONNECTION_PROTOCOLS.has(url.protocol)) return url;
    return undefined;
  } catch {
    return undefined;
  }
}

function isHttpProtocol(protocol: string): boolean {
  return protocol === "http:" || protocol === "https:";
}

function isIdentifierSegment(segment: string): boolean {
  if (UUID_SEGMENT.test(segment)) return true;
  if (HEX_SEGMENT.test(segment)) return true;
  if (NUMERIC_SEGMENT.test(segment)) return true;
  return OPAQUE_SEGMENT.test(segment) && /\d/.test(segment) && /[A-Za-z]/.test(segment);
}

function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value;
  }
}

function redactParams(
  raw: string,
  options: UrlRedactionOptions,
  replacement: string,
): { value: string; redacted: boolean } {
  let redacted = false;
  const parts = raw.split("&").map((part) => {
    if (part.length === 0) return part;
    const separator = part.indexOf("=");
    if (separator < 0) return part;
    const rawKey = part.slice(0, separator);
    const rawValue = part.slice(separator + 1);
    const key = decodeParam(rawKey);
    const value = decodeParam(rawValue);
    if (
      isCredentialSensitiveKey(key, options.sensitiveKeys) ||
      options.isSensitiveValue(value)
    ) {
      redacted = true;
      return `${rawKey}=${replacement}`;
    }
    return part;
  });
  return { value: parts.join("&"), redacted };
}

/**
 * Redacts the sensitive parts of an http(s) or connection URI. Returns the
 * value unchanged when it is not a supported URL or has nothing to remove.
 */
export function redactUrlString(
  value: string,
  options: UrlRedactionOptions,
): UrlRedactionResult {
  const unchanged: UrlRedactionResult = {
    value,
    credentialRedacted: false,
    identifiersMasked: false,
  };
  if (!looksLikeUrlForRedaction(value)) return unchanged;

  const url = parseRedactableUrl(value);
  if (!url) return unchanged;

  const replacement = options.replacement ?? "[REDACTED]";
  const idPlaceholder = options.idPlaceholder ?? "[id]";
  const http = isHttpProtocol(url.protocol);

  let credentialRedacted = url.username.length > 0 || url.password.length > 0;
  let identifiersMasked = false;

  let pathname = url.pathname;
  if (http && options.maskPathIds === true) {
    pathname = url.pathname
      .split("/")
      .map((segment) => {
        if (segment.length === 0 || !isIdentifierSegment(decodeParam(segment))) {
          return segment;
        }
        identifiersMasked = true;
        return idPlaceholder;
      })
      .join("/");
  }

  let search = "";
  if (url.search.length > 1) {
    const params = redactParams(url.search.slice(1), options, replacement);
    if (params.redacted) credentialRedacted = true;
    search = `?${params.value}`;
  } else if (url.search.length === 1) {
    search = "?";
  }

  let hash = url.hash;
  if (url.hash.includes("=")) {
    const params = redactParams(url.hash.slice(1), options, replacement);
    if (params.redacted) credentialRedacted = true;
    hash = `#${params.value}`;
  }

  if (!credentialRedacted && !identifiersMasked) return unchanged;

  return {
    value: `${url.protocol}//${url.host}${pathname}${search}${hash}`,
    credentialRedacted,
    identifiersMasked,
  };
}
