import { useEffect, useState } from 'react';
import { BinCollection, supabase } from './lib/supabase';
import { MirrorPreview } from './components/MirrorPreview';
import { BinManager } from './components/BinManager';
import { Sparkles, Loader2 } from 'lucide-react';

export default function App() {
  const [collections, setCollections] = useState<BinCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('bin_collections')
      .select('*')
      .order('collection_date', { ascending: true });
    if (error) {
      setError(error.message);
    } else {
      setCollections((data ?? []) as BinCollection[]);
      setError(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-full">
      <header className="max-w-6xl mx-auto px-6 pt-10 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400/80 to-teal-600/80 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">MMM-Bin-Days</h1>
            <p className="text-xs text-white/50">
              MagicMirror² module preview &amp; schedule manager
            </p>
          </div>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Syncing
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-16 grid grid-cols-1 lg:grid-cols-5 gap-8">
        <section className="lg:col-span-2">
          <div className="sticky top-6">
            <div className="mb-3 text-xs uppercase tracking-widest text-white/40">
              Mirror preview
            </div>
            <MirrorPreview collections={collections} />
            <p className="mt-4 text-xs text-white/40 leading-relaxed">
              This mirrors how the MagicMirror module renders on your display.
              Only future collections are shown, grouped by date.
            </p>
          </div>
        </section>

        <section className="lg:col-span-3">
          {error && (
            <div className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              {error}
            </div>
          )}
          <BinManager collections={collections} onChanged={load} />
        </section>
      </main>
    </div>
  );
}
