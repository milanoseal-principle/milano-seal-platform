// Isolated transport only: execute the application's Supabase table operations
// against PostgreSQL. All authorization/domain rules remain in canonical code/SQL.
const identifier = value => {
 if (!/^[a-z_][a-z0-9_]*$/.test(value)) throw Error('FIXTURE_SQL_IDENTIFIER_INVALID');
 return '"' + value + '"';
};
export function sqlClient(db, bytes = new Map()) {
 return {
  from(table) {
   const name=identifier(table), filters=[], values=[];
   let action='select', payload, selection='*', options={}, cardinality, maximum, ordering;
   const parameter=value=>{values.push(value);return '$'+values.length;};
   const query={
    select(columns='*', opts={}) {selection=columns;options=opts;return this;},
    insert(data) {action='insert';payload=data;return this;},
    update(data) {action='update';payload=data;return this;},
    eq(key,value) {filters.push(identifier(key)+'='+parameter(value));return this;},
    gt(key,value) {filters.push(identifier(key)+'>'+parameter(value));return this;},
    gte(key,value) {filters.push(identifier(key)+'>='+parameter(value));return this;},
    in(key,items) {filters.push(identifier(key)+' in ('+items.map(parameter).join(',')+')');return this;},
    order(key,opts={}) {ordering=identifier(key)+(opts.ascending===false?' desc':' asc');return this;},
    limit(value) {if(!Number.isInteger(value)||value<1)throw Error('FIXTURE_LIMIT_INVALID');maximum=value;return this;},
    maybeSingle() {cardinality='maybe';return execute();},
    single() {cardinality='one';return execute();},
    then(resolve,reject) {return execute().then(resolve,reject);},
   };
   async function execute() {
    try {
     const columns=selection==='*'?'*':selection.split(',').map(identifier).join(',');
     let sql;
     if(action==='insert') {const keys=Object.keys(payload);sql=`insert into ${name}(${keys.map(identifier)}) values(${keys.map(k=>parameter(payload[k]))}) returning ${columns}`;}
     else if(action==='update') {sql=`update ${name} set ${Object.keys(payload).map(k=>identifier(k)+'='+parameter(payload[k])).join(',')}`;}
     else sql=`select ${options.head?'count(*)::int as count':columns} from ${name}`;
     if(filters.length) sql+=' where '+filters.join(' and ');
     if(ordering)sql+=' order by '+ordering;
     if(maximum)sql+=' limit '+maximum;
     const rows=(await db.query(sql,values)).rows;
     if(cardinality==='one'&&rows.length!==1)throw Error('FIXTURE_EXPECTED_ONE_ROW');
     return {data:options.head?null:cardinality?rows[0]??null:rows,error:null,count:options.head?rows[0].count:null};
    } catch(error) {return {data:null,error:{code:error.code,message:error.message},count:null};}
   }
   return query;
  },
  async rpc(name,args) {
   try {const entries=Object.entries(args),rows=(await db.query(`select ${identifier(name)}(${entries.map(([key],i)=>identifier(key)+' => $'+(i+1))}) as result`,entries.map(([,v])=>v))).rows;return {data:rows[0]?.result,error:null};}
   catch(error) {return {data:null,error:{code:error.code,message:error.message}};}
  },
  storage:{from(bucket) {return {download:async path=>bytes.has(bucket+'/'+path)?{data:new Blob([bytes.get(bucket+'/'+path)]),error:null}:{data:null,error:{message:'NOT_FOUND'}}};}},
 };
}
