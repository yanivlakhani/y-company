const LEGAL_LINKS = [
  { label: "privacy", href: "#privacy" },
  { label: "terms", href: "#terms" },
  { label: "shipping", href: "#shipping" },
] as const;

const WHATSAPP_NUMBER = "971500000000";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-stone-200 px-6 py-8 md:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {LEGAL_LINKS.map(({ label, href }) => (
            <li key={label}>
              <a
                href={href}
                className="text-xs lowercase tracking-[0.3em] text-stone-500 transition-opacity duration-200 ease-out hover:opacity-70"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs lowercase tracking-[0.3em] text-stone-500 transition-opacity duration-200 ease-out hover:opacity-70"
        >
          whatsapp support
        </a>
      </div>
    </footer>
  );
}
