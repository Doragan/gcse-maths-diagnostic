export function trackEvent(name: string) {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", name);
  }
}