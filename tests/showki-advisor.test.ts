import {normalizeSalesPlatform} from '@/data/inquiry-choices';
import {describe, expect, it} from 'vitest';
import {createAdvisor} from '../services/knowledge/advisor';
import {advisorBriefKeys} from '@/lib/advisor-contracts';
import {inquirySchema} from '@/lib/contracts';
import {studioPackagingProducts} from '@/data/legacy-packaging-catalog';
import {createStudioGenerateRequest} from '@/lib/sku-3d-studio';
import {decodeStudioShare, encodeStudioShare} from '@/lib/studio-delivery';

describe('SHOWKI customer requirements', () => {
  it('passes every conversation turn to the model, including corrections and exclusions', async () => {
    const messages = [{role: 'user', content: '5000 bottles, no fragrance, Canada.'}, {role: 'assistant', content: 'What capacity?'}, {role: 'user', content: 'Change to 3000. 50ml. No essential oils either.'}];
    let sent = '';
    const result = await createAdvisor({id: 'test', async generate(request) {sent = request.input; return {reply: 'What packaging material do you prefer?', brief: Object.fromEntries(advisorBriefKeys.map(key => [key, key === 'quantity' ? '3000' : ''])), suggestions: ['Glass', 'PP']};}})({locale: 'en', messages});
    expect(JSON.parse(sent).conversation).toEqual(messages);
    expect(result.brief.quantity).toBe('3000');
    expect(result.suggestions).toEqual(['Glass', 'PP']);
  });
  it('does not simulate a successful conversation when a provider is absent or broken', async () => {
    await expect(createAdvisor()({locale:'zh',messages:[{role:'user',content:'乳液'}]})).rejects.toThrow('ADVISOR_NOT_CONFIGURED');
    await expect(createAdvisor({id:'bad',generate:async()=>({reply:'fake'})})({locale:'zh',messages:[{role:'user',content:'乳液'}]})).rejects.toThrow();
  });
  it('maps conversational channel names back to form choices without losing custom names', () => {
    expect(['Shopify', '美容院', 'A custom retailer'].map(normalizeSalesPlatform)).toEqual(['Shopify / DTC', 'Beauty salons / spas', 'A custom retailer']);
  });
  it('validates structured details and retains a transcript longer than the old notes limit', () => {
    const input={name:'QA',businessEmail:'qa@example.test',company:'Test',market:'Canada',category:'lotion',sku:'CUSTOM',configuration:'',quantity:'3000',budget:'To discuss',launchDate:'3 months',productGoal:'Hydration',packagingPreference:'Glass pump',certificationConstraints:'',notes:'',privacyConsent:true,salesChannel:'both',salesPlatforms:['Shopify / DTC','Beauty salons / spas'],efficacy:'Hydration',productColor:'White',texture:'Light lotion',otherNeeds:'No fragrance or alcohol',conversation:[{role:'user',content:'A'.repeat(3000)}]};
    const result=inquirySchema.parse(input);
    expect(result.conversation?.[0].content).toHaveLength(3000);
    expect(result.otherNeeds).toBe(input.otherNeeds);
    expect(result.salesPlatforms).toHaveLength(2);
    expect(inquirySchema.safeParse({...input,privacyConsent:false}).success).toBe(false);
  });
  it('offers the brochure families and retained legacy formats with shareable configurations', () => {
    expect(studioPackagingProducts.filter(item => item.source)).toHaveLength(42);
    expect(studioPackagingProducts.slice(0, 4).map(item => item.name.zh)).toEqual(['HD-1267 慕斯瓶','HD-1159 磨砂膏罐','HD-843 双层棉片盒','HD-844 双仓洗护瓶']);
    expect(studioPackagingProducts.slice(-4).map(item => item.name.zh)).toEqual(['乳液瓶','洁面瓶','真空瓶','玻璃精华瓶']);
    expect(new Set(studioPackagingProducts.map(item => item.sku)).size).toBe(studioPackagingProducts.length);
    for(const product of studioPackagingProducts){
      const specifications=createStudioGenerateRequest({sku:product.sku}).specifications;
      const state={sku:product.sku,specifications,assemblyState:'open' as const,
        ...(product.editablePrint ? {printText: product.editablePrint.defaults} : {})};
      expect(decodeStudioShare(encodeStudioShare(state))).toEqual(state);
    }
  });
});
