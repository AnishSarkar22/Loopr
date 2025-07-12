import { writable } from 'svelte/store';

interface User {
  id: string;
  name: string;
  email: string;
  // add other user properties as needed
}

export const user = writable<User | null>(null);
export const isAuthenticated = writable(false);