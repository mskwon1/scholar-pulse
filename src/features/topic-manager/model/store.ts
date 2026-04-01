import { atom } from 'jotai';
export const aiPromptsAtom = atom<Record<number, string>>({});
export const recommendingAtom = atom<Record<number, boolean>>({});
