import type { Equipment, Notice, ScoredNotice, WorkOrder } from './scoring';

/* ─────────────────────────────────────────────────────────────
   Swimlane timeline: one row per equipment, red / green / yellow events
───────────────────────────────────────────────────────────── */

const ROW_H = 30;
const LABEL_W = 190;
const WIDTH = 1000;
const PAD_TOP = 26;

const YELLOW_FILL = { HIGH: '#d97706', MEDIUM: '#fbbf24', LOW: '#fde68a' } as const;

interface Props {
    equipments: Equipment[];
    yellows: ScoredNotice[];
    greens: Notice[];
    workOrders: WorkOrder[];
    start: string;
    end: string;
    lang: 'en' | 'fr';
    highlight?: Set<string>;
    onSelect?: (noticeId: string) => void;
}

export default function FluxTimeline({ equipments, yellows, greens, workOrders, start, end, lang, highlight, onSelect }: Props) {
    const t0 = Date.parse(start);
    const t1 = Date.parse(end);
    const plotW = WIDTH - LABEL_W - 32;
    const x = (d: string) => LABEL_W + ((Date.parse(d) - t0) / (t1 - t0)) * plotW;
    const inRange = (d: string) => { const v = Date.parse(d); return v >= t0 && v <= t1; };
    const rowY = new Map(equipments.map((e, i) => [e.id, PAD_TOP + i * ROW_H + ROW_H / 2]));
    const height = PAD_TOP + equipments.length * ROW_H + 8;

    // Month ticks (thinned so labels never overlap)
    const ticks: { d: string; label: string }[] = [];
    const cursor = new Date(t0);
    cursor.setUTCDate(1);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    const months = Math.max(1, Math.round((t1 - t0) / (30 * 86_400_000)));
    const step = months > 12 ? 2 : 1;
    let k = 0;
    while (cursor.getTime() <= t1) {
        if (k % step === 0) {
            const iso = cursor.toISOString().slice(0, 10);
            ticks.push({
                d: iso,
                label: cursor.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' }),
            });
        }
        cursor.setUTCMonth(cursor.getUTCMonth() + 1);
        k++;
    }

    const dim = (id: string) => highlight && highlight.size > 0 && !highlight.has(id);

    return (
        <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${WIDTH} ${height}`} className="w-full min-w-[720px]" role="img"
                aria-label={lang === 'fr' ? 'Chronologie des flux par équipement' : 'Flow timeline by equipment'}>
                {/* Grid */}
                {ticks.map(tk => (
                    <g key={tk.d}>
                        <line x1={x(tk.d)} x2={x(tk.d)} y1={PAD_TOP - 6} y2={height - 8} stroke="#e2e8f0" />
                        <text x={x(tk.d)} y={14} textAnchor="middle" fontSize="10" fill="#64748b">{tk.label}</text>
                    </g>
                ))}
                {equipments.map((e, i) => (
                    <g key={e.id}>
                        {i % 2 === 0 && <rect x={0} y={PAD_TOP + i * ROW_H} width={WIDTH} height={ROW_H} fill="#f8fafc" />}
                        <text x={8} y={rowY.get(e.id)! + 4} fontSize="11" fill="#334155" fontWeight={600}>{e.tag}</text>
                        <text x={62} y={rowY.get(e.id)! + 4} fontSize="10" fill="#64748b">
                            {e.name.length > 20 ? e.name.slice(0, 19) + '…' : e.name}
                        </text>
                    </g>
                ))}

                {/* Green: preventive notices + work orders */}
                {[...greens, ...workOrders.filter(o => o.flux === 'VERT')].filter(ev => inRange(ev.date) && rowY.has(ev.equipmentId)).map(ev => (
                    <circle key={ev.id} cx={x(ev.date)} cy={rowY.get(ev.equipmentId)!} r={3.5} fill="#10b981" opacity={dim(ev.id) ? 0.25 : 0.9}>
                        <title>{`${ev.id} · ${ev.date} · ${lang === 'fr' ? 'Préventif' : 'Preventive'}`}</title>
                    </circle>
                ))}

                {/* Yellow notices, shade = priority class */}
                {yellows.filter(n => inRange(n.date) && rowY.has(n.equipmentId)).map(n => (
                    <circle key={n.id} cx={x(n.date)} cy={rowY.get(n.equipmentId)!} r={n.priority === 'HIGH' ? 6.5 : 5}
                        fill={YELLOW_FILL[n.priority]} stroke={n.priority === 'HIGH' ? '#78350f' : '#b45309'} strokeWidth={n.priority === 'HIGH' ? 1.5 : 0.75}
                        opacity={dim(n.id) ? 0.25 : 1}
                        className={onSelect ? 'cursor-pointer' : undefined}
                        onClick={onSelect ? () => onSelect(n.id) : undefined}>
                        <title>{`${n.id} · ${n.date} · ${n.symptom} · ${n.score}/100`}</title>
                    </circle>
                ))}

                {/* Red breakdowns */}
                {workOrders.filter(o => o.flux === 'ROUGE' && inRange(o.date) && rowY.has(o.equipmentId)).map(o => {
                    const cx = x(o.date), cy = rowY.get(o.equipmentId)!;
                    return (
                        <rect key={o.id} x={cx - 5} y={cy - 5} width={10} height={10} fill="#dc2626"
                            transform={`rotate(45 ${cx} ${cy})`} opacity={dim(o.id) ? 0.25 : 1}>
                            <title>{`${o.id} · ${o.date} · ${o.symptom} · ${o.downtimeHours} h`}</title>
                        </rect>
                    );
                })}
            </svg>
        </div>
    );
}

export function TimelineLegend({ lang }: { lang: 'en' | 'fr' }) {
    const fr = lang === 'fr';
    return (
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-red-600 rotate-45" /> {fr ? 'OT rouge (panne)' : 'Red WO (breakdown)'}</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> {fr ? 'Préventif / planifié' : 'Preventive / planned'}</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-600 ring-1 ring-amber-900" /> {fr ? 'Avis jaune — priorité haute' : 'Yellow — high priority'}</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> {fr ? 'priorité moyenne' : 'medium'}</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-200 ring-1 ring-amber-600" /> {fr ? 'priorité basse' : 'low'}</span>
        </div>
    );
}
