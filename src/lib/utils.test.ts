import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
    expect(cn('a', undefined, 'b', false, null)).toBe('a b');
  });

  it('deduplicates conflicting Tailwind utility classes preferring the last', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-left', 'text-right')).toBe('text-right');
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('handles complex inputs and preserves unique classes', () => {
    const result = cn('px-2 py-3', ['hover:bg-gray-100', 'px-4'], { 'font-bold': true }, '');
    expect(result).toBe('py-3 hover:bg-gray-100 px-4 font-bold');
  });
});