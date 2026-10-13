import { cn } from "@/lib/utils";

/**
 * One existing image serves as the website's favicon and its in-page brand mark.
 * Keep this path synchronized with index.html and the README.
 */
export function VerseMark({ className }: { className?: string }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}assets/verse-mark.jpg`}
      alt=""
      aria-hidden="true"
      width={40}
      height={40}
      className={cn("h-10 w-10 shrink-0 rounded-lg object-contain", className)}
    />
  );
}
