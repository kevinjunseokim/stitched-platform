import { describe, expect, it } from 'vitest';

import {
  allStepsComplete,
  canNavigateToStep,
  isStepComplete,
} from './addItemValidation';

const STEPS = [
  { id: 'basics' },
  { id: 'player' },
  { id: 'game' },
  { id: 'auth' },
  { id: 'photos' },
  { id: 'price' },
  { id: 'visibility' },
  { id: 'review' },
];

const COMPLETE = {
  title: 'Bat',
  sport: 'MLB',
  type: 'Bat',
  player: 'corbin-carroll',
  usage: 'Game-used',
  auth: 'MLB Authentication',
  images: ['/api/uploads/x.png'],
  price: '1200',
  priceDate: '2024-01-01',
  source: 'Goldin',
  visibility: 'public',
  forSale: false,
};

describe('addItemValidation', () => {
  it('requires basics fields before advancing', () => {
    expect(isStepComplete('basics', { title: 'Bat' })).toBe(false);
    expect(isStepComplete('basics', { title: 'Bat', sport: 'MLB', type: 'Bat' })).toBe(true);
  });

  it('blocks forward navigation until prior steps are complete', () => {
    expect(canNavigateToStep(2, 0, { title: 'Bat', sport: 'MLB', type: 'Bat' }, STEPS)).toBe(false);
    expect(canNavigateToStep(1, 0, COMPLETE, STEPS)).toBe(true);
  });

  it('allows navigating back to earlier steps', () => {
    expect(canNavigateToStep(0, 3, {}, STEPS)).toBe(true);
  });

  it('requires every step before save', () => {
    expect(allStepsComplete(COMPLETE, STEPS)).toBe(true);
    expect(allStepsComplete({ ...COMPLETE, images: [] }, STEPS)).toBe(false);
  });
});
