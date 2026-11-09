// Resolve Next's bundled server-only marker for standalone server-condition scripts.
// No application module or provider transport is replaced.
import {registerHooks,createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const marker=require.resolve('next/dist/compiled/server-only/empty.js');
registerHooks({resolve(specifier,context,next){return specifier==='server-only'?{url:new URL('file://'+marker).href,shortCircuit:true}:next(specifier,context);}});
