/** Continue until an empty page: hosted PostgREST caps may be below requested size. */
export async function readAllKeyset<T>(fetchPage:(cursor:T|null)=>Promise<T[]>,key:(row:T)=>string,maximum=20000):Promise<T[]> {
 const rows:T[]=[];const seen=new Set<string>();let cursor:T|null=null;
 for(;;){const page=await fetchPage(cursor);if(!page.length)return rows;
  for(const row of page){const id=key(row);if(!id||seen.has(id))throw Error('PAGINATION_DID_NOT_ADVANCE');seen.add(id);rows.push(row);if(rows.length>maximum)throw Error('RESULT_LIMIT_EXCEEDED_USE_NARROWER_FILTER');}
  cursor=page.at(-1)!;
 }
}
