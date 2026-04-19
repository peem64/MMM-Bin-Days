import { BinCollection } from '../lib/supabase';
import { formatFriendlyDate, daysUntil } from '../lib/dates';
import { hexForColor } from '../lib/binColors';
import { Trash2 } from 'lucide-react';

type Props = {
  collections: BinCollection[];
  maxCollections?: number;
};

export function MirrorPreview({ collections, maxCollections = 6 }: Props) {
  const upcoming = [...collections]
    .filter((c) => daysUntil(c.collection_date) >= 0)
    .sort((a, b) => a.collection_date.localeCompare(b.collection_date));

  const grouped = new Map<string, BinCollection[]>();
  for (const c of upcoming) {
    const list = grouped.get(c.collection_date) ?? [];
    list.push(c);
    grouped.set(c.collection_date, list);
  }
  const dates = Array.from(grouped.keys()).slice(0, maxCollections);

  return (
    <div className="rounded-2xl bg-black border border-white/10 shadow-2xl p-8 font-display">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-5">
        <Trash2 className="w-5 h-5 text-white/70" />
        <h2 className="text-white/80 tracking-[0.25em] text-xs uppercase">
          Bin Collections
        </h2>
      </div>

      {dates.length === 0 ? (
        <div className="text-white/40 text-sm py-6 text-center">
          No upcoming collections.
        </div>
      ) : (
        <ul className="space-y-3">
          {dates.map((date, idx) => (
            <li
              key={date}
              className={`flex items-center justify-between py-2 ${
                idx === 0
                  ? 'text-white'
                  : 'text-white/65'
              }`}
            >
              <span
                className={`font-light ${
                  idx === 0 ? 'text-xl' : 'text-base'
                }`}
              >
                {formatFriendlyDate(date)}
              </span>
              <span className="flex items-center gap-2 flex-wrap justify-end">
                {grouped.get(date)!.map((bin) => (
                  <span
                    key={bin.id}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full ring-1 ring-white/20"
                      style={{ backgroundColor: hexForColor(bin.bin_color) }}
                    />
                    <span className="text-white/85">{bin.bin_type}</span>
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 pt-4 border-t border-white/5 text-[10px] tracking-widest uppercase text-white/30">
        MMM-Bin-Days preview
      </div>
    </div>
  );
}
