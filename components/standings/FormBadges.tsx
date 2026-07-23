import { cn } from "@/lib/utils";

const formStyles: Record<"W" | "D" | "L", string> = {
  W: "bg-success text-success-foreground",
  D: "bg-muted text-muted-foreground",
  L: "bg-destructive/15 text-destructive",
};

export function FormBadges({
  form,
  label,
  className,
}: {
  form: Array<"W" | "D" | "L">;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="img"
      className={cn("flex items-center gap-1", className)}
      aria-label={`${label}: ${form.join(", ")}`}
    >
      {form.map((result, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
            formStyles[result]
          )}
        >
          {result}
        </span>
      ))}
    </div>
  );
}
