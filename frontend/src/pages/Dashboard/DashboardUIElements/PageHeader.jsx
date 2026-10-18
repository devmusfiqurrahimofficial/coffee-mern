export const PageHeader = ({ title, description, actions }) => (
  <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 className="font-serif text-2xl font-black leading-tight text-[var(--color-text)] md:text-3xl">
        {title}
      </h1>
      {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
  </header>
);

export default PageHeader;
