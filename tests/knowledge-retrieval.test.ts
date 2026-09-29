import {expect, it} from 'vitest';
import {rankBm25, reciprocalRankFusion, tokenizeKnowledge, cosineSimilarity} from '../services/knowledge/retrieval';

it('tokenizes multilingual words and exact product identifiers', () => {
  const tokens = tokenizeKnowledge('GT-EYE-001 水凝胶眼膜 Hyaluronic Acid');
  expect(tokens).toContain('gt-eye-001');
  expect(tokens).toContain('hyaluronic');
  expect(tokens.some(token => token.includes('眼膜'))).toBe(true);
});

it('scores actual BM25 matches and returns no irrelevant fallback', () => {
  const chunks = [{id: 'exact', text: 'GT-EYE-001 眼膜 透明质酸 保湿'}, {id: 'other', text: '面霜罐 PP 包装'}, {id: 'long', text: '眼膜 ' + '包装 '.repeat(100)}];
  expect(rankBm25('GT-EYE-001 眼膜', chunks)[0].id).toBe('exact');
  expect(rankBm25('zebra-unrelated', chunks)).toEqual([]);
});

it('fuses ranks rather than incompatible raw scores and validates vector shape', () => {
  const result = reciprocalRankFusion([{id: 'a', score: 100}, {id: 'b', score: 1}], [{id: 'b', score: .9}, {id: 'c', score: .8}]);
  expect(result[0].id).toBe('b');
  expect(cosineSimilarity([1, 0], [1, 0])).toBe(1);
  expect(() => cosineSimilarity([1], [1, 2])).toThrow('VECTOR_DIMENSION_MISMATCH');
  expect(() => cosineSimilarity([0, 0], [1, 0])).toThrow('INVALID_VECTOR');
});
