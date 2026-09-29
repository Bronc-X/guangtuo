import {allPackagingProducts} from '../data/legacy-packaging-catalog';
import type {InquiryInput} from './contracts';
import {encodeStudioShare} from './studio-delivery';
export function customerDesignInfo(design:NonNullable<InquiryInput['design']>) {
  const product=allPackagingProducts.find(p=>p.sku===design.sku);
  let href:string|undefined;
  if(design.kind==='existing') {try{href='/zh/studio/#'+encodeStudioShare(design);}catch{/* Historical or retired options remain visible in the saved specification. */}}
  return {name:product?.name.zh??design.sku,href,specifications:Object.entries(design.specifications).map(([key,value])=>{
    const group=product?.optionGroups.find(g=>g.id===key);
    return {key,label:group?.label.zh??key,value:group?.options.find(o=>o.id===value)?.label.zh??value};
  })};
}
