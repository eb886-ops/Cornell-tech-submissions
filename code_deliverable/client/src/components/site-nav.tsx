import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

function Wordmark() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-label="Meet in the Middle logo">
      <circle cx="9" cy="16" r="6.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="23" cy="16" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path d="M15 16h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function SiteNav() {
  const [location] = useLocation();
  return (
    <header className="sticky top-0 z-40 border-b border-card-border bg-background/90 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-foreground" data-testid="link-home">
          <Wordmark />
          <span className="font-serif text-base">Meet in the Middle</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/planner"
            data-testid="link-planner"
            className={cn(
              "text-sm px-3 py-1.5 rounded-md hover-elevate active-elevate-2",
              location === "/planner" ? "text-primary font-medium" : "text-muted-foreground",
            )}
          >
            Plan a meetup
          </Link>
        </nav>
      </div>
    </header>
  );
}
