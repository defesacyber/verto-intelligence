import { describe, it, expect } from 'vitest';
import { calculateROI, calculateMargin, calculateIRR, calculateNPV } from './financial-engine';

describe('Financial Engine', () => {
  it('should calculate ROI correctly', () => {
    expect(calculateROI(200, 1000)).toBe(20);
    expect(calculateROI(0, 1000)).toBe(0);
    expect(calculateROI(500, 0)).toBe(0);
  });

  it('should calculate Margin correctly', () => {
    expect(calculateMargin(25, 100)).toBe(25);
    expect(calculateMargin(50, 200)).toBe(25);
  });

  it('should calculate IRR (TIR) for a simple cash flow', () => {
    // Initial investment -100, return 110 after 1 year (12 months)
    // Monthly rate approx 0.8%
    const flows = [-100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 110];
    const irr = calculateIRR(flows);
    expect(irr).toBeGreaterThan(9);
    expect(irr).toBeLessThan(11);
  });

  it('should calculate NPV (VPL) correctly', () => {
    const flows = [-100, 50, 60];
    const nlp = calculateNPV(flows, 0.1); // 10% annual
    expect(nlp).toBeGreaterThan(0);
  });
});
