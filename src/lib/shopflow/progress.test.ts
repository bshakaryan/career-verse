import { describe, it, expect, vi, afterEach } from 'vitest';
import { emptyProgress, saveProgress, progressKey, progressSchema } from './progress';
import { newRun } from './engine';
afterEach(() => vi.unstubAllGlobals());
describe('guest progress persistence', () => {
  it('restores separate runs and refuses a stale tab overwrite', () => {
    const data = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
    });
    const initial = emptyProgress();
    const first = newRun();
    const saved = saveProgress(initial, {...initial, runs:[first], active:first.id});
    const second = newRun();
    const latest = saveProgress(saved, {...saved, runs:[first, second], active:second.id});
    expect(progressSchema.parse(JSON.parse(data.get(progressKey)!))).toEqual(latest);
    expect(() => saveProgress(saved, {...saved, demoPro:true})).toThrow('another tab');
    expect(JSON.parse(data.get(progressKey)!).runs.map((r: {id:string})=>r.id)).toEqual([first.id,second.id]);
  });
});
