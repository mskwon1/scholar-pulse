import type { User } from '@supabase/supabase-js';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// Auth State
export const userAtom = atomWithStorage<User | null>('supabase-user', null);

// Dashboard Temporary Local States
export const aiPromptsAtom = atom<Record<number, string>>({});
export const recommendingAtom = atom<Record<number, boolean>>({});
