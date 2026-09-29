import {describe,it,expect} from 'vitest';
import {aiIsRunning, aiStepAvailable, restoreAiJob, suggestedAiStep} from '../../src/lib/content-ai-workflow';
import type {ContentAiJob} from '../../src/lib/content-ai-contracts';
const job=(id:string,patch:Partial<ContentAiJob>={}):ContentAiJob=>({id,version:1,brief:{kind:'article',topic:'产品介绍',facts:'产品事实',sourceText:'',sourceUrl:'',referenceMediaId:null,language:'zh',imageStyle:''},state:'draft',createdAt:'2026-09-21',updatedAt:'2026-09-21',textModel:'text',imageModel:'image',...patch});
describe('recover AI workspace without starting another generation',()=>{
  it('restores the exact requested task instead of replacing it with the newest',()=>{
    const older=job('older',{state:'imaging'}), latest=job('latest');
    expect(restoreAiJob([latest,older],'older')).toBe(older);
    expect(suggestedAiStep(older)).toBe('image');expect(aiIsRunning(older)).toBe(true);
  });
  it('recovers a running legacy task when no task was bookmarked',()=>{
    const active=job('active',{state:'writing'});
    expect(restoreAiJob([job('newer'),active],null)).toBe(active);
    expect(restoreAiJob([job('newer'),active],'deleted')).toBe(active);
    expect(restoreAiJob([active],'new')).toBeUndefined();
  });
  it('restores a completed image to review and an image failure to the retry step',()=>{
    const done=job('done',{state:'ready',imageMediaId:'image',output:{title:'标题',summary:'摘要',body:'正文',category:'分类'}});
    expect(suggestedAiStep(done)).toBe('review');expect(aiStepAvailable('review',done)).toBe(true);
    expect(suggestedAiStep({...done,state:'failed',errorStep:'image'})).toBe('image');
    expect(aiStepAvailable('review',job('incomplete'))).toBe(false);
  });
  it('does not expose later workflow steps before their inputs exist',()=>{
    expect(aiStepAvailable('prompts')).toBe(false);expect(aiStepAvailable('copy',job('draft'))).toBe(false);
    expect(aiStepAvailable('image',job('planned',{prompts:{textPrompt:'文字提示词',imagePrompt:'图片提示词'}}))).toBe(true);
  });
});
