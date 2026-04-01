import { atom } from 'jotai';
import { User } from '@supabase/auth-js';
export const userAtom = atom<User | null>(null);
