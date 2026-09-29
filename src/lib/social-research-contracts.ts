export type SocialPost = {id:string; title:string; url:string; author:string; excerpt:string; published:string; views:string; image:string};
export type SocialKeyword = {word:string; angle:string; sourceIds:string[]};
export type SocialResearch = {
  id:string; kind:'article'|'marketing'; query:string; language:'zh'|'en';
  state:'searching'|'found'|'analyzing'|'ready'|'empty'|'failed';
  posts:SocialPost[]; keywords:SocialKeyword[]; createdAt:string; updatedAt:string; error?:string;
};
