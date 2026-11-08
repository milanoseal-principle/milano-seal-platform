import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ronIncidentDeadline, ronIncidentSchema } from '../../lib/bluenotary/securityIncidents';
const detected='2026-01-01T12:00:00Z';
const evidence={category:'JOURNAL',containment:'OPEN',authority_basis_reference:'fixture:notification-review',responsible_operator:'00000000-0000-4000-8000-000000000001',required_authorities:['FLORIDA_DEPARTMENT_OF_STATE'],notifications:{}} as const;
test('seven-day deadline uses original detection and preserves overdue truth',()=>{
  const base={...evidence,required_authorities:[...evidence.required_authorities]};
  assert.deepEqual(ronIncidentDeadline(detected,base,Date.parse('2026-01-02T12:00:00Z')),{due_at:'2026-01-08T12:00:00.000Z',state:'PENDING'});
  assert.equal(ronIncidentDeadline(detected,base,Date.parse('2026-01-09T12:00:00Z')).state,'OVERDUE');
  for(const [sent_at,state] of [['2026-01-07T12:00:00Z','EVIDENCED_ON_TIME'],['2026-01-09T12:00:00Z','EVIDENCED_LATE']]) {
    assert.equal(ronIncidentDeadline(detected,{...base,notifications:{FLORIDA_DEPARTMENT_OF_STATE:{reference:'fixture:dos',sent_at}}},Date.parse('2026-01-10T12:00:00Z')).state,state);
  }
});
test('invalid detection and unproved notification cannot produce an on-time verdict',()=>{
  const base={...evidence,required_authorities:[...evidence.required_authorities]};
  assert.throws(()=>ronIncidentDeadline('invalid',base));
  assert.throws(()=>ronIncidentDeadline('2999-01-01T12:00:00Z',base));
  assert.equal(ronIncidentDeadline(detected,{...base,notifications:{FLORIDA_DEPARTMENT_OF_STATE:{reference:'',sent_at:detected}}},Date.parse('2026-01-09T12:00:00Z')).state,'OVERDUE');
  assert.equal(ronIncidentSchema.safeParse({evidence:{notifications:{FLORIDA_DEPARTMENT_OF_STATE:{sent:true}}}}).success,false);
});
