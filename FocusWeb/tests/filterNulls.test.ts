import { describe, it, expect } from 'vitest';
import { filterNulls } from '../src/utils/filterNulls';

describe('filterNulls', () => {
  it('removes null and undefined but keeps 0 and empty string', () => {
    expect(filterNulls({ a: 1, b: null, c: undefined, d: 0, e: '' }))
      .toEqual({ a: 1, d: 0, e: '' });
  });
  it('returns input when not an object', () => {
    expect(filterNulls(undefined)).toBeUndefined();
  });
});
