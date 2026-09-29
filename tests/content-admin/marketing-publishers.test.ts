import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {expect, it, vi} from 'vitest';
import sharp from 'sharp';
import {createMarketingPublishers} from '../../services/marketing/publishers';
import {createWechatPublisher} from '../../services/marketing/wechat';

it('submits a TikTok video with the selected visibility and preserves the task receipt', async () => {
  const root=await mkdtemp(path.join(tmpdir(),'marketing-publisher-'));
  try {
    const video=path.join(root,'video.mp4'); await writeFile(video,'test');
    const fetcher=vi.fn<typeof fetch>();
    fetcher.mockResolvedValueOnce(Response.json([{id:'account-1',identifier:'tiktok',name:'Test'}]));
    fetcher.mockResolvedValueOnce(Response.json({id:'media-1',path:'https://media.example.test/video.mp4'}));
    fetcher.mockResolvedValueOnce(Response.json([{postId:'task-1',integration:'account-1'}]));
    const publisher=createMarketingPublishers({MARKETING_POSTIZ_URL:'https://postiz.example.test/api/public/v1',MARKETING_POSTIZ_API_KEY:'test-key'},fetcher);
    const result=await publisher.send({platform:'tiktok',title:'Example',text:'第一行\n\n第三行',video,cover:Buffer.from('test'),visibility:'private'});
    expect(result.id).toBe('task-1');
    const request=JSON.parse(fetcher.mock.calls[2][1]?.body as string);
    expect(request.posts[0].settings).toMatchObject({privacy_level:'SELF_ONLY',autoAddMusic:'no',brand_organic_toggle:true,video_made_with_ai:false});
    expect(request.posts[0].value[0].content).toBe('第一行\n\n第三行');
    expect(fetcher.mock.calls[1][1]?.body).toBeInstanceOf(FormData);
  } finally {await rm(root,{recursive:true,force:true});}
});

it('creates a WeChat article draft before requesting publication and escapes editor text', async () => {
  const fetcher=vi.fn<typeof fetch>();
  for(const response of [{access_token:'test-token',expires_in:7200},{media_id:'cover'},{media_id:'draft'},{publish_id:'publish-task'}]) fetcher.mockResolvedValueOnce(Response.json(response));
  const publisher=createWechatPublisher({MARKETING_WECHAT_APP_ID:'test-app',MARKETING_WECHAT_APP_SECRET:'test-secret'},fetcher);
  const cover=await sharp({create:{width:1,height:1,channels:3,background:'white'}}).png().toBuffer();
  expect((await publisher.send('Title','<script>\n\nEnd',cover)).id).toBe('publish-task');
  const body=JSON.parse(fetcher.mock.calls[2][1]?.body as string);
  expect(body.articles[0].content).toBe('<p>&lt;script&gt;</p><p><br /></p><p>End</p>');
  expect(String(fetcher.mock.calls[3][0])).toContain('/freepublish/submit');
  expect(fetcher.mock.calls.every(([url])=>!String(url).includes('/message/mass/'))).toBe(true);
});
