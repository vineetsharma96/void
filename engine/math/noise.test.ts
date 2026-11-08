import { describe, it, expect } from 'vitest';
import { fbm3D } from './noise';

describe('fbm3D', () => {
  it('should return a value for standard positive coordinates', () => {
    const value = fbm3D(1.5, 2.5, 3.5);
    expect(typeof value).toBe('number');
    expect(value).not.toBeNaN();
  });

  it('should return a value for negative coordinates', () => {
    const value = fbm3D(-1.5, -2.5, -3.5);
    expect(typeof value).toBe('number');
    expect(value).not.toBeNaN();
  });

  it('should handle octaves = 0', () => {
    const value = fbm3D(1, 1, 1, 0);
    // Based on implementation logic: maxValue remains 0, total remains 0, returns 0 / 0 = NaN
    expect(value).toBeNaN();
  });

  it('should handle octaves = 1', () => {
    const val1 = fbm3D(1.2, 3.4, 5.6, 1);
    // Value should be well-defined
    expect(typeof val1).toBe('number');
    expect(val1).not.toBeNaN();
  });

  it('should handle negative octaves by acting like octaves = 0', () => {
    const value = fbm3D(1, 1, 1, -1);
    expect(value).toBeNaN();
  });

  it('should handle lacunarity = 0', () => {
    const value = fbm3D(1, 1, 1, 4, 0);
    expect(typeof value).toBe('number');
    expect(value).not.toBeNaN();
  });

  it('should handle gain = 0', () => {
    const value = fbm3D(1, 1, 1, 4, 2.0, 0);
    expect(typeof value).toBe('number');
    expect(value).not.toBeNaN();
  });

  it('should handle fractional octaves by truncating or loop logic', () => {
    // A standard `for (let i = 0; i < 1.5; i++)` runs for i=0 and i=1
    const val1 = fbm3D(1, 1, 1, 1.5);
    expect(typeof val1).toBe('number');
    expect(val1).not.toBeNaN();
  });
});
