import { describe, it, expect } from 'vitest';
import { simulateAggregate } from './simulateAggregate';

describe('simulateAggregate', () => {
  it('漸化式の検算 m=2, s=1 (stochastic=false)', () => {
    const res = simulateAggregate({
      N: 3,
      meanChildren: 2,
      sdChildren: 0,
      partnerRate: 1, // 確実にするため1
      seed: 42
    }, false);
    
    // N=3 の levels を取得
    // degree=1: m=2, down_1 = 2 (egoの子2人)
    // degree=2: down_2 = m*down_1 + s*1 = 4 + 1 = 5
    // degree=3: down_3 = m*down_2 + s*2 = 10 + 2 = 12

    expect(res.levels[0].descendantsCollateral).toBe(2);
    expect(res.levels[1].descendantsCollateral).toBe(5);
    expect(res.levels[2].descendantsCollateral).toBe(12);
  });

  it('N=1, μ=0 の場合、親2人のみ(子0)', () => {
    const res = simulateAggregate({
      N: 1,
      meanChildren: 0,
      sdChildren: 0,
      partnerRate: 1,
      seed: 42
    }, false);

    expect(res.levels[0].ancestors).toBe(2); // up_1 = 2
    expect(res.levels[0].descendantsCollateral).toBe(0); // 子は0
    expect(res.levels[0].total).toBe(2);
  });
});
