import { FUTURE_CONTENT } from "@/lib/content";

export function FutureSection() {
  return (
    <div className="max-w-xl space-y-8 font-sans text-left">
      <p className="text-sm leading-relaxed font-normal text-body">
        {FUTURE_CONTENT.intro}
      </p>

      <div className="space-y-6 border-t border-border pt-4">
        {FUTURE_CONTENT.items.map((item) => (
          <div key={item.title} className="group">
            <h4 className="mb-1 font-mono text-xs font-medium tracking-wide text-header">
              {item.title}
            </h4>
            <p className="text-xs leading-relaxed text-mono-tag transition-colors group-hover:text-body">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
