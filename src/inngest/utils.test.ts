import { describe, it, expect } from 'vitest';
import { lastAssistantTextMessageContent } from '@/inngest/utils';

// Minimal AgentResult-like shape for tests
type AnyMessage = { role: string; content?: any };
const mkResult = (output: AnyMessage[]) => ({ output } as any);

describe('lastAssistantTextMessageContent', () => {
  it('returns the last assistant string content', () => {
    const result = mkResult([
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello there' },
      { role: 'assistant', content: 'Final answer' },
    ]);
    expect(lastAssistantTextMessageContent(result)).toBe('Final answer');
  });

  it('concatenates array content parts when content is array of text entries', () => {
    const result = mkResult([
      { role: 'assistant', content: [{ text: 'Hello' }, { text: ' ' }, { text: 'world!' }] },
    ]);
    expect(lastAssistantTextMessageContent(result)).toBe('Hello world!');
  });

  it('returns undefined when no assistant messages are present', () => {
    const result = mkResult([{ role: 'user', content: 'Only user here' }]);
    expect(lastAssistantTextMessageContent(result)).toBeUndefined();
  });
});