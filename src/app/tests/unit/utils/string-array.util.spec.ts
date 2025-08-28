import { toStringArray, chunk } from '../../../shared/utils/string-array.util';

/**
 * Unit tests for string-array utility functions
 * These functions are critical for processing campaign tracking parameters
 */
describe('String Array Utilities', () => {
  describe('toStringArray()', () => {
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

    describe('prefix handling', () => {
      it('should strip single prefix type', () => {
        expect(toStringArray('#hashtag', { stripPrefix: '#' })).toEqual(['hashtag']);
        expect(toStringArray('@mention', { stripPrefix: '@' })).toEqual(['mention']);
      });

      it('should handle array input with prefixes', () => {
        expect(toStringArray(['#one', '#two'], { stripPrefix: '#' }))
          .toEqual(['one', 'two']);
      });

      it('should handle multiple prefix types', () => {
        const input = ['#hashtag', '@mention', 'keyword'];
        const expected = ['hashtag', 'mention', 'keyword'];
        expect(toStringArray(input, { stripPrefix: ['#', '@'] })).toEqual(expected);
      });

      it('should only strip prefix from beginning of string', () => {
        expect(toStringArray('text#notahashtag', { stripPrefix: '#' }))
          .toEqual(['text#notahashtag']);
      });
    });

    describe('cleaning and filtering', () => {
      it('should filter empty values', () => {
        expect(toStringArray(['one', '', 'two'])).toEqual(['one', 'two']);
      });

      it('should trim whitespace', () => {
        expect(toStringArray([' one ', '  two  '])).toEqual(['one', 'two']);
      });

      it('should handle mixed input with filtering', () => {
        const input = ['  valid  ', '', '  ', 'ok'] as string[];
        expect(toStringArray(input)).toEqual(['valid', 'ok']);
      });
    });
  });

  describe('chunk()', () => {
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

    it('should handle edge cases', () => {
      expect(chunk(null as any)).toEqual([]);
      expect(chunk(undefined as any)).toEqual([]);
      expect(chunk('string' as any)).toEqual([]);
    });

    it('should handle zero or negative chunk size', () => {
      const input = [1, 2, 3];
      // Default to chunk size 1 in these cases
      expect(chunk(input, 0)).toEqual([[1], [2], [3]]);
      expect(chunk(input, -1)).toEqual([[1], [2], [3]]);
    });
  });
});
