import {z} from 'zod';
import type {BufferChannel} from '../../src/lib/buffer-contracts';

export class BufferApiError extends Error {
  constructor(message: string, readonly uncertain = false) {super(message);}
}
const postFields = 'id channelId status dueAt sentAt schedulingType externalLink allowedActions error { message }';
const postSchema = z.object({id:z.string(),channelId:z.string(),status:z.enum(['draft','error','needs_approval','scheduled','sending','sent']),dueAt:z.string().nullable().optional(),sentAt:z.string().nullable().optional(),schedulingType:z.string(),externalLink:z.string().nullable().optional(),allowedActions:z.array(z.string()).optional(),error:z.object({message:z.string()}).nullable().optional()});
export type BufferPost = z.infer<typeof postSchema>;
export function createBufferClient(key: string, fetcher: typeof fetch = fetch) {
  async function query(query: string, variables: Record<string,unknown> = {}, mutation = false): Promise<Record<string,unknown>> {
    let response: Response;
    try {response = await fetcher('https://api.buffer.com', {method:'POST',redirect:'error',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({query,variables}),signal:AbortSignal.timeout(30_000)});}
    catch {throw new BufferApiError(mutation ? 'Buffer 回执未收到，请到 Buffer 核查后处理，避免重复发布。' : '无法连接 Buffer，请稍后重试。', mutation);}
    if (!response.ok) throw new BufferApiError(response.status === 401 || response.status === 403 ? 'API Key 无效、已过期或权限不足，请检查 Buffer 设置。' : response.status === 429 ? 'Buffer API 额度或请求频率已达上限，请稍后重试。' : 'Buffer 服务暂时不可用，请稍后核查。', mutation && response.status >= 500);
    let body: {data?:Record<string,unknown>; errors?:unknown[]};
    try {
      const reader=response.body?.getReader(); if(!reader) throw new Error();
      const chunks:Uint8Array[]=[];let size=0;
      try {for(;;) {const item=await reader.read();if(item.done)break;size+=item.value.length;if(size>2_000_000)throw new Error();chunks.push(item.value);}} finally {await reader.cancel();}
      body=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {throw new BufferApiError('Buffer 回执无法解析，请到 Buffer 核查。',mutation);}
    // Any partial mutation response can represent an accepted post. Never blindly replay it.
    if (body.errors?.length || !body.data) throw new BufferApiError('Buffer 未返回完整结果，请检查 API 权限或到 Buffer 核查。',mutation);
    return body.data;
  }
  function post(value:unknown, mutation=false) {const result=postSchema.safeParse(value);if(!result.success)throw new BufferApiError('Buffer 发布回执不完整，请到 Buffer 核查。',mutation);return result.data;}
  return {
    async organizations() {const data=await query('query { account { organizations { id name } } }');return z.object({organizations:z.array(z.object({id:z.string(),name:z.string()}))}).parse(data.account).organizations;},
    async channels(organizationId:string):Promise<BufferChannel[]> {
      const data=await query('query Channels($id: OrganizationId!) { channels(input: {organizationId:$id}) { id name service timezone isDisconnected isLocked isQueuePaused } }',{id:organizationId});
      return z.array(z.object({id:z.string(),name:z.string(),service:z.string(),timezone:z.string(),isDisconnected:z.boolean(),isLocked:z.boolean(),isQueuePaused:z.boolean()})).parse(data.channels);
    },
    async create(input:Record<string,unknown>) {
      const data=await query(`mutation Create($input: CreatePostInput!) { createPost(input:$input) { ... on PostActionSuccess { post { ${postFields} } } ... on MutationError { message } } }`,{input},true);
      const result=data.createPost as {post?:unknown; message?:string};
      if (result?.message && !result.post) throw new BufferApiError('Buffer 拒绝了排期，请检查账号权限、平台素材要求和待发布额度。');
      return post(result?.post,true);
    },
    async get(id:string) {const data=await query(`query Post($id: PostId!) { post(input:{id:$id}) { ${postFields} } }`,{id});return data.post === null ? null : post(data.post);},
    async remove(id:string) {
      const data=await query('mutation Delete($input: DeletePostInput!) { deletePost(input:$input) { ... on DeletePostSuccess { id } ... on VoidMutationError { message } } }',{input:{id}},true);
      const result=data.deletePost as {id?:string;message?:string};
      if(result?.id===id)return;
      throw new BufferApiError(result?.message ? 'Buffer 未取消这条排期，请检查当前发布状态。' : '取消回执不完整，请到 Buffer 核查。',!result?.message);
    },
  };
}
export type BufferClient = ReturnType<typeof createBufferClient>;
