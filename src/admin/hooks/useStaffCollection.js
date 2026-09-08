import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../config/supabase';

export function useStaffCollection(table) {
  const [state, setState] = useState({ records: [], loading: true, error: '' });
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!supabase) { setState({ records: [], loading: false, error: 'Supabase is not configured. Connect the backend to use this page.' }); return; }
      setState({ records: [], loading: true, error: '' });
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) throw new Error('Sign in under Settings → Security to read shared records. An active staff account is required.');
        const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
        if (error) throw error;
        if (active) setState({ records: data || [], loading: false, error: '' });
      } catch (error) { if (active) setState({ records: [], loading: false, error: error.message }); }
    };
    load();
    if (!supabase) return () => { active = false; };
    const channel = supabase.channel(`workspace-${table}`).on('postgres_changes', { event: '*', schema: 'public', table }, load).subscribe();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => { if (active && event !== 'INITIAL_SESSION') reload(); });
    return () => { active = false; subscription.unsubscribe(); supabase.removeChannel(channel); };
  }, [table, revision, reload]);
  const save = async (record, values) => {
    const query = record.id ? supabase.from(table).update(values).eq('id', record.id) : supabase.from(table).insert(values);
    const { error } = await query.select('id').single();
    if (error) throw error;
    reload();
  };
  return { ...state, reload, save };
}
