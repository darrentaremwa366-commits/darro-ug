import { initDb } from '@/lib/db';
try { initDb(); } catch(e) { console.error('DB init failed', e); }
export {};
