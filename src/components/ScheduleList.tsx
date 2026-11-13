"use client";
import { useState } from "react";
import type { EventItem, EventKind } from "@/lib/types";
import type { EventPhase } from "@/lib/catalog";
import { EVENT_KIND, EventRow } from "./Bits";

type Row = { event: EventItem; phase: EventPhase };

const PHASES: { key: EventPhase; label: string }[] = [
  { key: "ongoing", label: "진행 중" },
  { key: "upcoming", label: "예정" },
  { key: "ended", label: "종료" },
];

export function ScheduleList({ rows }: { rows: Row[] }) {
  const [phase, setPhase] = useState<EventPhase>("ongoing");
  const [kind, setKind] = useState<EventKind | "">("");
  const kinds = [...new Set(rows.map((r) => r.event.kind))];
  const shown = rows.filter((r) => r.phase === phase && (!kind || r.event.kind === kind));

  const tab = (on: boolean) =>
    `btn min-h-10 whitespace-nowrap border-[1.5px] px-4 text-[13px] ${on ? "border-coral bg-coral text-white" : "border-line bg-white text-ink-soft"}`;

  return (
    <div>
      <div className="chips" role="tablist" aria-label="진행 상태">
        {PHASES.map((p) => (
          <button key={p.key} type="button" role="tab" aria-selected={phase === p.key} onClick={() => setPhase(p.key)} className={tab(phase === p.key)}>
            {p.label} {rows.filter((r) => r.phase === p.key).length}
          </button>
        ))}
      </div>
      <div className="chips mt-2.5">
        <button type="button" aria-pressed={!kind} onClick={() => setKind("")} className={`sticker min-h-8 px-3 ${!kind ? "bg-ink text-white" : "bg-white text-ink-soft"}`}>
          모든 종류
        </button>
        {kinds.map((k) => (
          <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(kind === k ? "" : k)} className={`sticker min-h-8 px-3 ${kind === k ? "bg-ink text-white" : EVENT_KIND[k].cls}`}>
            {EVENT_KIND[k].label}
          </button>
        ))}
      </div>

      {shown.length > 0 ? (
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          {shown.map((r) => (
            <li key={r.event.id}>
              <EventRow event={r.event} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="card dots mt-5 px-6 py-12 text-center text-[14px] text-ink-soft">이 조건에 해당하는 일정이 없어요.</p>
      )}
    </div>
  );
}
