import { writable } from 'svelte/store';

export const session = writable<{
    token: string;
    studentid: string;
} | null>(null);