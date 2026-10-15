import Link from "next/link";
import { cn } from "@/lib/utils";
import { SPACE_TABS, spaceHref, type SpaceTab } from "@/lib/learning-space";

// The six tabs. Plain links (the tab is in the address), so they work
// without JavaScript and Back goes to the previous tab. On a phone the row
// scrolls sideways instead of squashing.
export function TabBar({ current }: { current: SpaceTab }) {
  return (
    <nav aria-label="My Learning Space" className="-mx-4 overflow-x-auto px-4">
      <ul className="flex min-w-max gap-1 border-b border-border">
        {(Object.keys(SPACE_TABS) as SpaceTab[]).map((tab) => {
          const active = tab === current;
          return (
            <li key={tab}>
              <Link
                href={spaceHref(tab)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px block border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                {SPACE_TABS[tab]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
