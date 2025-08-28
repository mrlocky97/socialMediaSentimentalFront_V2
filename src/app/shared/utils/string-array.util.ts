/**
 * Utility to convert values to string arrays
 */
export interface ToStringArrayOptions {
  stripPrefix?: string | string[];
}

/**
 * Converts a value to string array, handling various input types
 * @param value - The value to convert (string, string[], null, undefined)
 * @param options - Options for conversion
 * @returns Normalized string array
 */
export function toStringArray(value: string | string[] | null | undefined, options: ToStringArrayOptions = {}): string[] {
  if (!value) return [];

  // Convert to array if it's a string
  const arr = Array.isArray(value) ? value : [value];

  // Filter empty values and apply transformations
  return arr
    .map(item => item?.trim())
    .filter(item => !!item)
    .map(item => {
      let result = item as string;
      
      // Strip prefix if specified (e.g., @ for mentions or # for hashtags)
      if (options.stripPrefix) {
        const prefixes = Array.isArray(options.stripPrefix) ? options.stripPrefix : [options.stripPrefix];
        
        for (const prefix of prefixes) {
          if (result.startsWith(prefix)) {
            result = result.substring(prefix.length);
            break;
          }
        }
      }
      
      return result;
    });
}

/**
 * Split array into chunks of specified size
 * @param arr - Array to split
 * @param size - Chunk size (default: 5)
 * @returns Array of arrays, each containing at most 'size' items
 */
export function chunk<T>(arr: T[], size = 5): T[][] {
  if (!Array.isArray(arr)) return [];
  
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  
  return result;
}
