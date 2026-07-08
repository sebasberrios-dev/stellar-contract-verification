"use client";

import { useState } from "react";
import { useI18n } from "../i18n/LanguageContext";
import { renderTokens } from "../i18n/renderTokens";
import type { Dict } from "../i18n/translations";

interface AccordionItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface AccordionProps {
  item: AccordionItem;
  isOpen: boolean;
  onToggle: () => void;
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="inline-block bg-code text-primary font-mono text-xs px-1.5 py-0.5 rounded">
      {children}
    </code>
  );
}

function IconInfo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function IconCode() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconChevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// SEP-58 field names are technical constants — never translated
const METADATA_FIELDS = [
  "source_repo",
  "source_rev",
  "bldimg",
  "tarball_sha256",
] as const;

function code(text: string, key: number) {
  return <Code key={key}>{text}</Code>;
}

function buildItems(d: Dict): AccordionItem[] {
  const a = d.accordion;
  return [
    {
      id: "sep58",
      title: a.sep58Title,
      icon: <IconInfo />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm leading-relaxed">{a.sep58Body}</p>
          <div>
            <p className="text-foreground/80 text-xs font-semibold uppercase tracking-wider mb-3">
              {a.fieldsLabel}
            </p>
            <ul className="space-y-2">
              {METADATA_FIELDS.map((field) => (
                <li key={field} className="flex items-start gap-3">
                  <Code>{field}</Code>
                  <span className="text-muted-foreground text-sm">{a.fields[field]}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "how",
      title: a.howTitle,
      icon: <IconCode />,
      content: (
        <ol className="space-y-3">
          {a.howSteps.map((text, i) => (
            <li key={text} className="flex items-start gap-4">
              <span className="font-mono text-xs text-muted-foreground/70 font-bold pt-0.5 w-5 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-muted-foreground text-sm leading-relaxed">
                {renderTokens(text, code)}
              </span>
            </li>
          ))}
        </ol>
      ),
    },
    {
      id: "why",
      title: a.whyTitle,
      icon: <IconShield />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm leading-relaxed">{a.whyBody}</p>
          <ul className="space-y-3">
            {a.whyPoints.map(({ head, body }) => (
              <li key={head} className="flex items-start gap-3">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span className="text-muted-foreground text-sm leading-relaxed">
                  <span className="text-foreground/90 font-medium">{head} — </span>{body}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
  ];
}

function AccordionRow({ item, isOpen, onToggle }: AccordionProps) {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between px-5 py-4 bg-card hover:bg-card-hover transition-colors text-left"
      >
        <span className="flex items-center gap-3 text-foreground/80 font-medium text-sm">
          <span className="text-secondary">{item.icon}</span>
          {item.title}
        </span>
        <span
          className="text-muted-foreground/80 transition-transform duration-300"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <IconChevron />
        </span>
      </button>

      <div
        className="transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isOpen ? "600px" : "0px",
          opacity: isOpen ? 1 : 0,
          overflow: "hidden",
        }}
      >
        <div className="px-5 pb-5 pt-4 bg-background border-t border-border">
          {item.content}
        </div>
      </div>
    </div>
  );
}

export default function AccordionSection() {
  const { d } = useI18n();
  const [openId, setOpenId] = useState<string | null>(null);
  const items = buildItems(d);

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <section className="w-full space-y-3">
      <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-widest mb-4">
        {d.accordion.heading}
      </h2>
      {items.map((item) => (
        <AccordionRow
          key={item.id}
          item={item}
          isOpen={openId === item.id}
          onToggle={() => toggle(item.id)}
        />
      ))}
    </section>
  );
}
