import { describe, it, expect } from 'vitest';
import { ensureMockData } from '../setup-mock-data';

describe('Overlay Flow', () => {
  it('should prepare mock data without errors', () => {
    expect(() => ensureMockData()).not.toThrow();
  });
});
