import { ReactNode } from "react";

type CardProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function Card({ title, description, actions, children }: CardProps) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
      {(title || description || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-lg font-semibold tracking-tight text-black">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-black/70">{description}</p>
            )}
          </div>
          {actions}
        </div>
      )}
      <div className={title || description || actions ? "mt-5" : undefined}>{children}</div>
    </section>
  );
}
