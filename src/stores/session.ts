import { get, writable } from 'svelte/store';

export const tokenStore = writable<string | null>(null);