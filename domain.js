/** Pure domain rules for Orbit JEE Student OS. No DOM or storage dependencies. */
export const SCHEMA_VERSION = 3;
export const SUBJECT_PRESETS = [
  { name: 'Physics', color: '#7c8cff', icon: '◉' },
  { name: 'Chemistry', color: '#e6a65d', icon: '◇' },
  { name: 'Mathematics', color: '#45b99b', icon: '∑' }
];
export const STATUSES = ['Not Started', 'Planned', 'In Progress', 'Practiced', 'Revision Due', 'Completed', 'Needs Improvement'];
export const ACTIVITY_TYPES = ['Theory / lecture', 'Solved examples', 'DPP', 'Exercise', 'JEE Main PYQ', 'JEE Advanced PYQ', 'Revision', 'Mock test', 'Mock analysis', 'Note-making', 'Doubt clearing', 'Custom'];
export const MODULE_TYPES = ['JEE Main PYQ', 'JEE Advanced PYQ', 'DPP', 'Coaching worksheet', 'Chapter-wise practice', 'Subject-wise practice', 'Mock test', 'Error log', 'Custom question bank', 'Custom revision set'];
export const NOTE_TYPES = ['Theory notes', 'Formula sheet', 'Short revision notes', 'Important concepts', 'PYQ solutions', 'Mistake notes', 'Doubt list', 'Test analysis', 'Custom'];

export function id(prefix = 'id') {
  return `${prefix}_${globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`}`;
}
export function todayISO(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function shiftDate(iso, days) {
  const [y,m,d] = iso.split('-').map(Number); const dt = new Date(y, m-1, d, 12);
  dt.setDate(dt.getDate()+days); return todayISO(dt);
}
export function weekStartISO(iso = todayISO()) {
  const [y,m,d] = iso.split('-').map(Number); const dt = new Date(y,m-1,d,12);
  const day = (dt.getDay()+6)%7; dt.setDate(dt.getDate()-day); return todayISO(dt);
}
export function monthStartISO(iso = todayISO()) { return `${iso.slice(0,7)}-01`; }
export function clamp(n, min = 0, max = 100) { return Math.min(max, Math.max(min, Number(n) || 0)); }
export function sum(items, pick = x => x) { return items.reduce((n, x) => n + (Number(pick(x)) || 0), 0); }
export function percent(numerator, denominator) { return denominator > 0 ? Math.round((numerator / denominator) * 100) : null; }
export function accuracy(attempted, correct) { return attempted > 0 ? Math.round((correct / attempted) * 100) : null; }
export function durationMinutes(session) {
  if (Number.isFinite(session.actualMinutes)) return Math.max(0, session.actualMinutes);
  if (!session.startedAt) return 0;
  const end = session.endedAt ? new Date(session.endedAt).getTime() : Date.now();
  return Math.max(0, Math.round((end - new Date(session.startedAt).getTime()) / 60000));
}
export function isDue(date, today = todayISO()) { return Boolean(date && date <= today); }
export function taskProgress(tasks) {
  const measurable = tasks.filter(t => t.status !== 'cancelled');
  return { total: measurable.length, done: measurable.filter(t => t.status === 'completed').length,
    partial: measurable.filter(t => t.status === 'partial').length,
    percent: percent(measurable.filter(t => t.status === 'completed').length, measurable.length) };
}
export function topicProgress(topic) {
  const checks = topic.milestones || {};
  const criteria = topic.criteria?.length ? topic.criteria : ['theory', 'examples', 'practice', 'revision'];
  const done = criteria.filter(key => Boolean(checks[key])).length;
  return { done, total: criteria.length, percent: percent(done, criteria.length), criteria };
}
export function questionStats(attempts) {
  const attempted = sum(attempts, a => a.outcome === 'correct' || a.outcome === 'incorrect' ? 1 : 0);
  const correct = sum(attempts, a => a.outcome === 'correct' ? 1 : 0);
  const incorrect = sum(attempts, a => a.outcome === 'incorrect' ? 1 : 0);
  const skipped = sum(attempts, a => a.outcome === 'skipped' ? 1 : 0);
  return { attempted, correct, incorrect, skipped, accuracy: accuracy(attempted, correct), total: attempts.length };
}
export function testMetrics(test) {
  const max = Number(test.maxMarks);
  const score = Number(test.score);
  const attempted = Number(test.correct || 0) + Number(test.incorrect || 0);
  const totalQuestions = Number(test.totalQuestions || 0);
  return { marksPercent: max > 0 && test.score !== '' && test.score != null && Number.isFinite(score) ? Math.round(score / max * 100) : null,
    accuracy: attempted > 0 ? Math.round(Number(test.correct || 0) / attempted * 100) : null,
    attemptedPercent: totalQuestions > 0 ? Math.round(attempted / totalQuestions * 100) : null };
}
export function normalizeLegacyTasks(legacy, now = new Date().toISOString()) {
  if (!Array.isArray(legacy)) return [];
  return legacy.filter(x => x && typeof x === 'object' && String(x.text || x.title || '').trim()).map(x => ({
    id: String(x.id || id('task')), title: String(x.text || x.title).slice(0,180), description: '', category: 'General',
    subjectId: null, chapterId: null, topicId: null, goalId: null, targetHorizon: 'daily',
    dueDate: x.dueDate || x.due || x.date || null, plannedDate: (typeof x.createdAt === 'string' ? x.createdAt.slice(0,10) : (typeof x.created === 'number' ? todayISO(new Date(x.created)) : null)) || todayISO(), plannedMinutes: 0,
    actualMinutes: 0, expectedQuestions: 0, completedQuestions: 0, correct: 0, incorrect: 0, skipped: 0,
    priority: ['low','medium','high'].includes(x.priority) ? x.priority : 'medium',
    status: x.completed || x.done ? 'completed' : 'todo', labels: [], createdAt: typeof x.createdAt === 'string' ? x.createdAt : (typeof x.created === 'number' ? new Date(x.created).toISOString() : now),
    updatedAt: typeof x.updatedAt === 'string' ? x.updatedAt : now, completedAt: (x.completed || x.done) ? (x.completedAt || now) : null,
    history: [{ at: now, action: 'migrated-from-orbit-tasks-v1' }]
  }));
}
export function makeInitialState() {
  return { version: SCHEMA_VERSION, profile: { setupComplete: false, displayName: '', examTarget: 'JEE Main + Advanced', studyLevel: 'Drop year', targetExamDate: '', availableHours: 6 },
    settings: { theme: 'dark', weekStartsOn: 'monday', studyDays: [1,2,3,4,5,6], dayStart: '06:00', dayEnd: '23:00', reduceMotion: false, revisionIntervals: [1,3,7,14,30], notifications: false },
    subjects: [], chapters: [], topics: [], goals: [], tasks: [], sessions: [], modules: [], attempts: [], notes: [], revisions: [], revisionEvents: [], tests: [], calendarEvents: [], activityTypes: [...ACTIVITY_TYPES], audit: [], activeSession: null, migratedLegacy: false };
}
export function safeMergeState(raw) {
  const base = makeInitialState();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  const arrayKeys = ['subjects','chapters','topics','goals','tasks','sessions','modules','attempts','notes','revisions','revisionEvents','tests','calendarEvents','activityTypes','audit'];
  for (const key of arrayKeys) if (Array.isArray(raw[key])) base[key] = raw[key];
  if (raw.profile && typeof raw.profile === 'object') base.profile = { ...base.profile, ...raw.profile };
  if (raw.settings && typeof raw.settings === 'object') base.settings = { ...base.settings, ...raw.settings };
  base.activeSession = raw.activeSession && typeof raw.activeSession === 'object' ? raw.activeSession : null;
  base.migratedLegacy = Boolean(raw.migratedLegacy);
  base.version = SCHEMA_VERSION;
  return base;
}
