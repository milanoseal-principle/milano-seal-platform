// One persistent psql process = one independent PostgreSQL backend session.
// Used only by isolated certification harnesses; it adds no runtime dependency.
// Queries use psql 16's \bind, so parameters are sent through the extended
// protocol and are never interpolated into SQL text. Each statement's outcome is
// read back from psql's ERROR/SQLSTATE variables on stdout, so errors are matched
// to the statement that raised them.
import {spawn} from 'node:child_process';

const quote=value=>{
 if(value===null||value===undefined)throw Error('PSQL_SESSION_NULL_PARAMETER_UNSUPPORTED');
 const text=Array.isArray(value)
  ?'{'+value.map(v=>{if(v===null||typeof v==='object')throw Error('PSQL_SESSION_ARRAY_ELEMENT_UNSUPPORTED');return '"'+String(v).replace(/[\\"]/g,m=>'\\'+m)+'"';}).join(',')+'}'
  :typeof value==='object'?JSON.stringify(value):String(value);
 return "'"+text.replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,'\\n')+"'";
};
const returnsRows=sql=>/^\s*(select|with)\b/i.test(sql)||/\breturning\b/i.test(sql);

export class PsqlSession {
 constructor({host,port=5432,user='postgres',database}){
  this.proc=spawn('psql',['-h',host,'-p',String(port),'-U',user,'-d',database,'-X','-q','-A','-t','-v','ON_ERROR_STOP=0','-v','VERBOSITY=terse'],
   {stdio:['pipe','pipe','pipe'],env:{...process.env,PGAPPNAME:'p23-concurrency'}});
  this.buffer='';this.waiters=[];this.sequence=0;this.closed=false;
  this.proc.stdout.setEncoding('utf8');
  this.proc.stdout.on('data',chunk=>{this.buffer+=chunk;this.drain();});
  this.proc.stderr.on('data',()=>{});// errors are read from :SQLSTATE / :LAST_ERROR_MESSAGE
  this.proc.on('exit',()=>{this.closed=true;for(const w of this.waiters.splice(0))w.reject(Error('PSQL_SESSION_EXITED'));});
 }
 drain(){
  while(this.waiters.length){
   const w=this.waiters[0],end=this.buffer.indexOf(w.marker);
   if(end<0)return;
   const lineEnd=this.buffer.indexOf('\n',end);if(lineEnd<0)return;
   const body=this.buffer.slice(0,end),status=this.buffer.slice(end+w.marker.length,lineEnd).trim();
   this.buffer=this.buffer.slice(lineEnd+1);this.waiters.shift();
   const [error,sqlstate,...message]=status.split(' ');
   if(error==='true'){const e=Error(message.join(' ')||'PSQL_ERROR');e.code=sqlstate;w.reject(e);}
   else w.resolve(body);
  }
 }
 send(command){
  if(this.closed)return Promise.reject(Error('PSQL_SESSION_CLOSED'));
  const marker=`__P23_END_${process.pid}_${++this.sequence}__ `;
  const promise=new Promise((resolve,reject)=>this.waiters.push({marker,resolve,reject}));
  this.proc.stdin.write(`${command}\n\\echo ${marker}:ERROR :SQLSTATE :LAST_ERROR_MESSAGE\n`);
  return promise;
 }
 // Same contract the certification fixtures use: query(sql, params) -> {rows}.
 async query(sql,params=[]){
  const statement=sql.trim().replace(/;\s*$/,'');
  const bind=params.length?' \\bind '+params.map(quote).join(' '):(statement.includes('$1')?' \\bind':'');
  if(!returnsRows(statement)){await this.send(`${statement}${bind} \\g`);return {rows:[],rowCount:null};}
  const wrapped=/\breturning\b/i.test(statement)&&!/^\s*(select|with)\b/i.test(statement)
   ?`with p23_rows as (${statement}) select coalesce(json_agg(p23_rows),'[]'::json) from p23_rows`
   :`select coalesce(json_agg(p23_rows),'[]'::json) from (${statement}) p23_rows`;
  const out=(await this.send(`${wrapped}${bind} \\g`)).trim();
  const rows=out?JSON.parse(out):[];
  return {rows,rowCount:rows.length};
 }
 async end(){if(this.closed)return;this.proc.stdin.end('\\q\n');await new Promise(r=>this.proc.once('exit',r));}
}
