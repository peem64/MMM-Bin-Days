import { useState } from 'react';
import { BinCollection, supabase } from '../lib/supabase';
import { BIN_PRESETS, COLOR_CHOICES, hexForColor } from '../lib/binColors';
import { todayIso } from '../lib/dates';
import { Plus, Trash2, CalendarDays, Loader2, AlertCircle } from 'lucide-react';
import { WheelieBin } from './WheelieBin';

type Props = {
  collections: BinCollection[];
  onChanged: () => void;
};

export function BinManager({ collections, onChanged }: Props) {
  const [binType, setBinType] = useState(BIN_PRESETS[0].type);
  const [binColor, setBinColor] = useState(BIN_PRESETS[0].color);
  const [collectionDate, setCollectionDate] = useState(todayIso());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = [...collections].sort((a, b) =>
    a.collection_date.localeCompare(b.collection_date)
  );

  async function handleAdd() {
    if (!binType.trim() || !collectionDate) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase
      .from('bin_collections')
      .insert({
        bin_type: binType.trim(),
        bin_color: binColor,
        collection_date: collectionDate,
      });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    onChanged();
  }

  async function handleDelete(id: string) {
    setBusy(true);
    setError(null);
    const { error } = await supabase.from('bin_collections').delete().eq('id', id);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    onChanged();
  }

  async function handleClearAll() {
    if (!confirm('Delete every bin collection row?')) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase
      .from('bin_collections')
      .delete()
      .gte('collection_date', '1900-01-01');
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    onChanged();
  }

  function applyPreset(type: string, color: string) {
    setBinType(type);
    setBinColor(color);
  }

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-white font-semibold tracking-tight text-lg">
            Collection schedule
          </h3>
          <p className="text-white/50 text-sm">
            Manage the bins shown on the mirror.
          </p>
        </div>
        <button
          onClick={handleClearAll}
          disabled={busy || collections.length === 0}
          className="text-xs text-red-300 hover:text-red-200 disabled:opacity-30 transition"
        >
          Clear all
        </button>
      </div>

      <div className="space-y-3 mb-5">
        <div>
          <label className="text-xs uppercase tracking-wider text-white/50 mb-2 block">
            Presets
          </label>
          <div className="flex flex-wrap gap-2">
            {BIN_PRESETS.map((p) => (
              <button
                key={p.type}
                onClick={() => applyPreset(p.type, p.color)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
                  binType === p.type
                    ? 'border-white/60 bg-white/10 text-white'
                    : 'border-white/10 bg-white/[0.02] text-white/70 hover:border-white/30'
                }`}
              >
                <WheelieBin color={p.hex} size={16} title={p.type} />
                {p.type}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs uppercase tracking-wider text-white/50 mb-1 block">
              Bin type
            </label>
            <input
              value={binType}
              onChange={(e) => setBinType(e.target.value)}
              className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-white/40"
              placeholder="e.g. Recycling"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-white/50 mb-1 block">
              Colour
            </label>
            <div
              role="radiogroup"
              aria-label="Bin colour"
              className="flex flex-wrap items-center gap-1.5 rounded-lg bg-black/40 border border-white/10 px-2 py-1.5 min-h-[42px]"
            >
              {COLOR_CHOICES.map((c) => {
                const selected = binColor === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={c.label}
                    title={c.label}
                    onClick={() => setBinColor(c.value)}
                    className={`group relative flex items-center justify-center rounded-md p-1 transition ${
                      selected
                        ? 'bg-white/15 ring-1 ring-white/60'
                        : 'hover:bg-white/5 ring-1 ring-transparent'
                    }`}
                  >
                    <WheelieBin
                      color={hexForColor(c.value)}
                      size={26}
                      title={c.label}
                      className={selected ? 'drop-shadow-[0_0_6px_rgba(255,255,255,0.25)]' : 'opacity-85 group-hover:opacity-100'}
                    />
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-white/50 mb-1 block">
              Date
            </label>
            <input
              type="date"
              value={collectionDate}
              onChange={(e) => setCollectionDate(e.target.value)}
              className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-white/40"
            />
          </div>
        </div>

        <button
          onClick={handleAdd}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/90 hover:bg-emerald-400 text-black font-medium px-4 py-2 text-sm transition disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add collection
        </button>

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="border-t border-white/10 pt-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/50 mb-3">
          <CalendarDays className="w-3.5 h-3.5" />
          <span>All scheduled collections</span>
          <span className="ml-auto text-white/30">{sorted.length}</span>
        </div>

        {sorted.length === 0 ? (
          <div className="text-white/40 text-sm py-4 text-center">
            Nothing scheduled yet. Add your first collection above.
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {sorted.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-3 py-3"
              >
                <WheelieBin
                  color={hexForColor(c.bin_color)}
                  size={22}
                  title={c.bin_type}
                  className="shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{c.bin_type}</div>
                  <div className="text-xs text-white/45">{c.collection_date}</div>
                </div>
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={busy}
                  className="text-white/40 hover:text-red-300 transition p-1.5 rounded-md"
                  aria-label="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
