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
  const [level, setLevel] = useState<SchoolLevel>("undergraduate");
  const [language, setLanguage] = useState<"all" | ProgramLanguage>("all");
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const titleId = useId();
  const selected = findSchool(value);
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return SCHOOLS.filter(
      (item) =>
        item.level === level &&
        (language === "all" || item.programLanguage === language) &&
        (!needle ||
          [item.name, item.abbreviation, ...item.aliases].some((text) =>
            text.toLowerCase().includes(needle),
          )),
    );
  }, [language, level, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setLevel(selected?.level ?? "undergraduate");
      setLanguage("all");
      dialog.current?.showModal();
      setActiveIndex(0);
    } else if (dialog.current?.open) {
      dialog.current.close();
    }
  }, [open, selected]);

  useEffect(() => {
    setActiveIndex(0);
    optionRefs.current = [];
  }, [matches.length, query, level, language]);

  const close = () => {
    setOpen(false);
    window.requestAnimationFrame(() => trigger.current?.focus());
  };

  const moveOption = (next: number) => {
    if (!matches.length) return;
    const index = (next + matches.length) % matches.length;
    setActiveIndex(index);
    optionRefs.current[index]?.focus();
  };

  return (
    <div className="field">
      <span className="label">{label}</span>
      <button
        ref={trigger}
        className="selector-trigger"
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        aria-label={
          selected
            ? `Change school, currently ${selected.name}`
            : "Choose a school"
        }
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
        onClose={() => {
          setOpen(false);
          window.requestAnimationFrame(() => trigger.current?.focus());
        }}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
      >
        <div className="dialog-head">
          <div>
            <span className="eyebrow">Academic profile</span>
            <h2 id={titleId}>Choose your school</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={close}
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
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  moveOption(0);
                }
              }}
              aria-controls={`${titleId}-options`}
            />
          </label>
          <div
            className="segmented"
            aria-label="Education level"
            role="tablist"
          >
            {(
              [
                ["undergraduate", "Undergraduate"],
                ["graduate", "Graduate"],
                ["professional", "Professional / Special"],
              ] as const
            ).map(([id, text]) => (
              <button
                type="button"
                role="tab"
                aria-selected={level === id}
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
          <p className="result-count" role="status" aria-live="polite">
            {matches.length} school{matches.length === 1 ? "" : "s"} found
          </p>
        </div>
        <div
          id={`${titleId}-options`}
          className="school-grid"
          role="listbox"
          aria-label="Schools"
        >
          {matches.map((item, index) => (
            <button
              ref={(node) => {
                optionRefs.current[index] = node;
              }}
              type="button"
              role="option"
              aria-selected={item.id === value}
              tabIndex={activeIndex === index ? 0 : -1}
              className="school-tile"
              key={item.id}
              onClick={() => {
                onChange(item.id);
                close();
              }}
              onFocus={() => setActiveIndex(index)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                  event.preventDefault();
                  moveOption(index + 1);
                } else if (
                  event.key === "ArrowLeft" ||
                  event.key === "ArrowUp"
                ) {
                  event.preventDefault();
                  moveOption(index - 1);
                } else if (event.key === "Home") {
                  event.preventDefault();
                  moveOption(0);
                } else if (event.key === "End") {
                  event.preventDefault();
                  moveOption(matches.length - 1);
                }
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
            onClick={() => {
              onChange("");
              close();
            }}
          >
            Clear selection
          </button>
        </div>
      </dialog>
    </div>
  );
}
