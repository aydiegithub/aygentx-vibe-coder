import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => {
  return {
    prisma: {
      message: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
    },
  };
});

vi.mock('@/inngest/client', () => {
  return {
    inngest: {
      send: vi.fn(),
    },
  };
});

import { messagesRouter } from '@/modules/messages/server/procedures';
import { prisma } from '@/lib/db';
import { inngest } from '@/inngest/client';

describe('messagesRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getMany returns messages ordered by updatedAt desc', async () => {
    (prisma.message.findMany as any).mockResolvedValue([{ id: '1' }, { id: '2' }]);
    const caller = messagesRouter.createCaller({ userId: 'test' } as any);
    const data = await caller.getMany();
    expect(prisma.message.findMany).toHaveBeenCalledWith({
      orderBy: { updatedAt: 'desc' },
    });
    expect(data).toEqual([{ id: '1' }, { id: '2' }]);
  });

  it('create persists user message and sends background job event', async () => {
    (prisma.message.create as any).mockResolvedValue({
      id: 'm1',
      content: 'Hello',
      role: 'USER',
      type: 'RESULT',
    });
    const caller = messagesRouter.createCaller({ userId: 'test' } as any);
    const created = await caller.create({ value: 'Hello' });
    expect(prisma.message.create).toHaveBeenCalledWith({
      data: {
        content: 'Hello',
        role: 'USER',
        type: 'RESULT',
      },
    });
    expect(inngest.send).toHaveBeenCalledWith({
      name: 'code-agent/run',
      data: { value: 'Hello' },
    });
    expect(created).toEqual({
      id: 'm1',
      content: 'Hello',
      role: 'USER',
      type: 'RESULT',
    });
  });

  it('create rejects invalid input (empty value)', async () => {
    const caller = messagesRouter.createCaller({ userId: 'test' } as any);
    await expect(caller.create({ value: '' } as any)).rejects.toBeTruthy();
  });
});