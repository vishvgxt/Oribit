import test from 'node:test';
import assert from 'node:assert/strict';
import { percent, accuracy, topicProgress, questionStats, testMetrics, normalizeLegacyTasks, safeMergeState, makeInitialState, weekStartISO, shiftDate } from '../domain.js';

test('percent and accuracy handle empty denominators without fake zeros', () => {
  assert.equal(percent(0, 0), null);
  assert.equal(accuracy(0, 0), null);
  assert.equal(percent(2, 4), 50);
  assert.equal(accuracy(4, 3), 75);
});

test('topic progress uses explicit configured milestones', () => {
  assert.deepEqual(topicProgress({ milestones:{ theory:true, practice:false }, criteria:['theory','practice'] }), {done:1,total:2,percent:50,criteria:['theory','practice']});
  assert.equal(topicProgress({}).percent, 0);
});

test('question statistics exclude skipped from accuracy denominator', () => {
  assert.deepEqual(questionStats([{outcome:'correct'},{outcome:'incorrect'},{outcome:'skipped'},{outcome:'unresolved'}]), {attempted:2,correct:1,incorrect:1,skipped:1,accuracy:50,total:4});
  assert.equal(questionStats([]).accuracy, null);
  assert.equal(questionStats([{outcome:'unresolved'}]).accuracy, null);
});

test('test marks percentage does not turn blank score into zero', () => {
  assert.equal(testMetrics({score:'',maxMarks:300,correct:0,incorrect:0}).marksPercent, null);
  assert.equal(testMetrics({score:180,maxMarks:300,correct:40,incorrect:10,totalQuestions:90}).marksPercent, 60);
  assert.equal(testMetrics({score:180,maxMarks:300,correct:40,incorrect:10,totalQuestions:90}).accuracy, 80);
});

test('legacy Orbit tasks retain title, due date, priority and completion', () => {
  const tasks=normalizeLegacyTasks([{id:'old-1',text:'Revise NLM',priority:'high',dueDate:'2026-11-01',completed:true,createdAt:'2026-10-01T10:00:00.000Z'}]);
  assert.equal(tasks.length,1); assert.equal(tasks[0].id,'old-1'); assert.equal(tasks[0].title,'Revise NLM'); assert.equal(tasks[0].priority,'high'); assert.equal(tasks[0].dueDate,'2026-11-01'); assert.equal(tasks[0].status,'completed');
});

test('safe state merge tolerates malformed arrays and keeps schema version', () => {
  const s=safeMergeState({version:1,tasks:[{id:'x'}],subjects:'bad',settings:{theme:'light'}});
  assert.equal(s.version,3); assert.equal(s.tasks.length,1); assert.deepEqual(s.subjects,[]); assert.equal(s.settings.theme,'light');
  assert.equal(makeInitialState().version,3);
});

test('date helpers use local calendar dates without UTC day shifts', () => {
  assert.equal(shiftDate('2026-01-01',-1),'2025-12-31');
  assert.equal(weekStartISO('2026-10-24'),'2026-10-19');
});
