import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { buildEnvironment } from '../scripts/build.mjs';

test('a build child receives sufficient heap without an external memory setting',()=>{
 const child=spawnSync(process.execPath,['-e',"process.stdout.write(String(require('node:v8').getHeapStatistics().heap_size_limit))"],{env:buildEnvironment({PATH:process.env.PATH}),encoding:'utf8'});
 assert.equal(child.status,0);assert.ok(Number(child.stdout)>6_000_000_000);
});
test('build memory retains other Node flags and an explicitly larger heap',()=>{
 const env=buildEnvironment({NODE_OPTIONS:'--use-openssl-ca --max-old-space-size=8192'});
 assert.match(env.NODE_OPTIONS,/--use-openssl-ca/);assert.match(env.NODE_OPTIONS,/--max-old-space-size=8192/);
});
test('a previously constrained heap is replaced for nested build workers',()=>{
 const env=buildEnvironment({NODE_OPTIONS:'--max_old_space_size=2048'});
 assert.equal(env.NODE_OPTIONS,'--max-old-space-size=6144');
});
