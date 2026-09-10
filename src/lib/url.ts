import { SITE_URL } from "@/lib/site";

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function confirmSubscriptionUrl(token: string): string {
  return absoluteUrl(`/subscribe/confirm?token=${encodeURIComponent(token)}`);
}

export function unsubscribeUrl(token: string): string {
  return absoluteUrl(`/unsubscribe?token=${encodeURIComponent(token)}`);
}
