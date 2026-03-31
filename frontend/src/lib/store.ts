import type { User } from '@supabase/supabase-js';
import { atom } from 'jotai';

// Auth State
export const userAtom = atom<User | null>(null);

// Dashboard Temporary Local States
export const aiPromptsAtom = atom<Record<number, string>>({});
export const recommendingAtom = atom<Record<number, boolean>>({});
