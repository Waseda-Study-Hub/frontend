"use client";

import { Search, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  findSchool,
  SCHOOLS,
  type ProgramLanguage,
  type SchoolLevel,
} from "@/lib/constants/schools";

type Props = { value?: string; onChange(value: string): void; label?: string };

export function SchoolSelector({
  value,
  onChange,
  label = "School or faculty",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<"all" | SchoolLevel>("all");
  const [language, setLanguage] = useState<"all" | ProgramLanguage>("all");
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const selected = findSchool(value);
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return SCHOOLS.filter(
      (item) =>
        (level === "all" || item.level === level) &&
        (language === "all" || item.programLanguage === language) &&
        (!needle ||
          [item.name, item.abbreviation, ...item.aliases].some((text) =>
            text.toLowerCase().includes(needle),
          )),
    );
  }, [language, level, query]);

  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);

  return (
    <div className="field">
      <span className="label">{label}</span>
      <button
        className="selector-trigger"
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        {selected ? (
          <>
            <b>{selected.abbreviation}</b>
            <span>{selected.name}</span>
          </>
        ) : (
          <span className="muted">Choose a school</span>
        )}
      </button>
      <dialog
        ref={dialog}
        className="school-dialog"
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
      >
        <div className="dialog-head">
          <div>
            <span className="eyebrow">Academic profile</span>
            <h2 id={titleId}>Choose your school</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close school selector"
          >
            <X />
          </button>
        </div>
        <div className="selector-controls">
          <label className="search">
            <Search aria-hidden="true" />
            <span className="sr-only">Search schools</span>
            <input
              autoFocus
              placeholder="Search name or abbreviation"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className="segmented" aria-label="Education level">
            {(
              [
                ["all", "All"],
                ["undergraduate", "Undergraduate"],
                ["graduate", "Graduate"],
                ["professional", "Professional / Special"],
              ] as const
            ).map(([id, text]) => (
              <button
                type="button"
                aria-pressed={level === id}
                key={id}
                onClick={() => setLevel(id)}
              >
                {text}
              </button>
            ))}
          </div>
          <div className="segmented compact" aria-label="Program language">
            {(
              [
                ["all", "All"],
                ["english-based", "English-based"],
                ["japanese-taught", "Japanese-taught"],
              ] as const
            ).map(([id, text]) => (
              <button
                type="button"
                aria-pressed={language === id}
                key={id}
                onClick={() => setLanguage(id)}
              >
                {text}
              </button>
            ))}
          </div>
        </div>
        <div className="school-grid" role="listbox" aria-label="Schools">
          {matches.map((item) => (
            <button
              type="button"
              role="option"
              aria-selected={item.id === value}
              className="school-tile"
              key={item.id}
              onClick={() => {
                onChange(item.id);
                setOpen(false);
              }}
            >
              <b>{item.abbreviation}</b>
              <span>{item.name}</span>
              <small>
                {item.level.replace("-", " ")} ·{" "}
                {item.programLanguage.replace("-", " ")}
              </small>
            </button>
          ))}
          {!matches.length && (
            <div className="empty">No schools match those filters.</div>
          )}
        </div>
        <div className="dialog-foot">
          <span>
            {selected
              ? `${selected.abbreviation} selected`
              : "No school selected"}
          </span>
          <button
            type="button"
            className="text-button"
            disabled={!value}
            onClick={() => onChange("")}
          >
            Clear selection
          </button>
        </div>
      </dialog>
    </div>
  );
}
