import { toStringArray, chunk } from './string-array.util';

describe('String Array Utilities', () => {
  describe('toStringArray', () => {
    it('should convert string to array', () => {
      expect(toStringArray('test')).toEqual(['test']);
    });

    it('should handle empty string', () => {
      expect(toStringArray('')).toEqual([]);
    });

    it('should handle null and undefined', () => {
      expect(toStringArray(null)).toEqual([]);
      expect(toStringArray(undefined)).toEqual([]);
    });

    it('should pass through arrays unchanged', () => {
      expect(toStringArray(['one', 'two'])).toEqual(['one', 'two']);
    });

    it('should strip prefixes', () => {
      expect(toStringArray('#hashtag', { stripPrefix: '#' })).toEqual(['hashtag']);
      expect(toStringArray('@mention', { stripPrefix: '@' })).toEqual(['mention']);
    });

    it('should handle multiple prefixes', () => {
      const input = ['#hashtag', '@mention', 'keyword'];
      const expected = ['hashtag', 'mention', 'keyword'];
      expect(toStringArray(input, { stripPrefix: ['#', '@'] })).toEqual(expected);
    });

    it('should filter empty values', () => {
      expect(toStringArray(['one', '', 'two'])).toEqual(['one', 'two']);
    });

    it('should trim whitespace', () => {
      expect(toStringArray([' one ', '  two  '])).toEqual(['one', 'two']);
    });
  });

  describe('chunk', () => {
    it('should split array into chunks of specified size', () => {
      const input = [1, 2, 3, 4, 5, 6, 7, 8];
      const expected = [[1, 2, 3], [4, 5, 6], [7, 8]];
      expect(chunk(input, 3)).toEqual(expected);
    });

    it('should handle empty arrays', () => {
      expect(chunk([], 3)).toEqual([]);
    });

    it('should handle arrays smaller than chunk size', () => {
      expect(chunk([1, 2], 5)).toEqual([[1, 2]]);
    });

    it('should use default chunk size of 5', () => {
      const input = [1, 2, 3, 4, 5, 6, 7];
      const expected = [[1, 2, 3, 4, 5], [6, 7]];
      expect(chunk(input)).toEqual(expected);
    });

    it('should handle non-array inputs', () => {
      expect(chunk(null as any)).toEqual([]);
      expect(chunk(undefined as any)).toEqual([]);
      expect(chunk('string' as any)).toEqual([]);
    });
  });
});
