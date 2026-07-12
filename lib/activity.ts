import { supabase } from './supabase';

export async function logActivity(
  type: string,
  description: string,
  entiteType?: string | null,
  entiteId?: string | null,
  utilisateur?: string
) {
  await supabase.from('activites').insert({
    type,
    description,
    entite_type: entiteType || null,
    entite_id: entiteId || null,
    utilisateur: utilisateur || 'Système',
  });
}
