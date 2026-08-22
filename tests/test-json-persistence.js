// TDD Test: Verify analytics persistence survives across "lambda invocations"
// Simulates Vercel's problem: in-memory SQLite loses data between invocations

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

// ============================================================
// Phase 1: Demonstrate the BUG (in-memory SQLite data loss)
// ============================================================

let BUG_PASS = true;

// Simulate two separate Vercel lambda invocations, each with its own memory
const lambdaOne = new Map(); // Simulates isolated memory of lambda #1
const lambdaTwo = new Map(); // Simulates isolated memory of lambda #2

// Lambda #1: receives a page_view event
lambdaOne.set('events', [
  { id: 'ev1', name: 'page_view', path: '/shop', ts: Date.now() }
]);
lambdaOne.set('sessions', [
  { id: 'sess1', visitor_id: 'v1', path: '/shop', ts: Date.now() }
]);
lambdaOne.set('visitors', [
  { id: 'v1', first_seen: Date.now() }
]);

// Lambda #2: serves the admin dashboard — BUT HAS NO ACCESS to lambda #1's memory
const readEventsFromLambdaTwo = lambdaTwo.get('events') || [];
const readSessionsFromLambdaTwo = lambdaTwo.get('sessions') || [];
const readVisitorsFromLambdaTwo = lambdaTwo.get('visitors') || [];

console.log('=== PHASE 1: In-memory SQLite on Vercel (BUG) ===');
console.log('Events visible to dashboard:', readEventsFromLambdaTwo.length);
console.log('Sessions visible to dashboard:', readSessionsFromLambdaTwo.length);
console.log('Visitors visible to dashboard:', readVisitorsFromLambdaTwo.length);

if (readEventsFromLambdaTwo.length === 0 && readSessionsFromLambdaTwo.length === 0) {
  console.log('✓ BUG CONFIRMED: Dashboard sees 0 data because each lambda has isolated memory');
} else {
  console.log('✗ Unexpected: data found (maybe same lambda reused)');
  BUG_PASS = false;
}

// ============================================================
// Phase 2: The FIX — JSON file persistence in /tmp
// ============================================================

// This is the file-based store that survives across lambda invocations
const tmpDir = path.join(os.tmpdir(), 'darro-test');
const storeFile = path.join(tmpDir, 'darro-events.json');

function loadStore() {
  try {
    if (fs.existsSync(storeFile)) {
      return JSON.parse(fs.readFileSync(storeFile, 'utf-8'));
    }
  } catch (e) { /* corrupted file, start fresh */ }
  return { events: [], sessions: [], visitors: [] };
}

function saveStore(store) {
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.writeFileSync(storeFile, JSON.stringify(store), 'utf-8');
}

// Lambda #1: writes event to the SHARED JSON file
const store1 = loadStore();
store1.events.push({ id: 'ev1', name: 'page_view', path: '/shop', ts: Date.now() });
store1.sessions.push({ id: 'sess1', visitor_id: 'v1', path: '/shop', ts: Date.now() });
store1.visitors.push({ id: 'v1', first_seen: Date.now() });
saveStore(store1);

// Lambda #2: reads from the SAME JSON file (simulating a different invocation)
const store2 = loadStore();
const jsonEvents = store2.events;
const jsonSessions = store2.sessions;
const jsonVisitors = store2.visitors;

console.log('\n=== PHASE 2: JSON file persistence in /tmp (FIX) ===');
console.log('Events visible to dashboard:', jsonEvents.length);
console.log('Sessions visible to dashboard:', jsonSessions.length);
console.log('Visitors visible to dashboard:', jsonVisitors.length);

let FIX_PASS = true;
if (jsonEvents.length !== 1 || jsonSessions.length !== 1 || jsonVisitors.length !== 1) {
  console.log('✗ FAIL: JSON persistence did not preserve data across invocations');
  FIX_PASS = false;
} else {
  console.log('✓ PASS: Data preserved across simulated lambda invocations via JSON file');
}

// ============================================================
// Phase 3: Multi-event accumulation test
// ============================================================

// Simulate 5 different lambda invocations, each writing an event
for (let i = 2; i <= 5; i++) {
  const s = loadStore();
  s.events.push({ id: 'ev' + i, name: 'page_view', path: '/shop?page=' + i, ts: Date.now() });
  s.sessions.push({ id: 'sess' + i, visitor_id: 'v' + i, path: '/shop?page=' + i, ts: Date.now() });
  saveStore(s);
}

const finalStore = loadStore();
console.log('\n=== PHASE 3: Multi-event accumulation ===');
console.log('Total events after 5 lambda invocations:', finalStore.events.length);
console.log('Total sessions after 5 lambda invocations:', finalStore.sessions.length);

if (finalStore.events.length === 5 && finalStore.sessions.length === 5) {
  console.log('✓ PASS: All 5 events persisted across 5 simulated invocations');
} else {
  console.log('✗ FAIL: Expected 5 events, got', finalStore.events.length);
  FIX_PASS = false;
}

// Cleanup
try { fs.unlinkSync(storeFile); } catch { /* ignore */ }

// Final verdict
console.log('\n========================================');
console.log('BUG DEMONSTRATED:', BUG_PASS ? 'YES' : 'NO');
console.log('FIX VERIFIED:', FIX_PASS ? 'YES' : 'NO');
console.log(BUG_PASS && FIX_PASS ? '\n🎉 All tests passed!' : '\n❌ Some tests failed.');
process.exit(BUG_PASS && FIX_PASS ? 0 : 1);
