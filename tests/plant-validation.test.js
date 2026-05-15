/**
 * Tests for plant data validation
 * Ensures plant objects have correct structure and valid data
 */

import { describe, it, expect } from 'vitest';

// Mirrors the validation in plants-renderer.js
function isValidPlant(plant) {
  if (!plant || typeof plant !== 'object') return false;
  if (!plant.commonName || typeof plant.commonName !== 'string') return false;
  if (!plant.botanicalName || typeof plant.botanicalName !== 'string') return false;
  if (!plant.fileSlug || typeof plant.fileSlug !== 'string') return false;
  return true;
}

describe('Plant Validation', () => {
  describe('isValidPlant', () => {
    it('should accept valid plant object', () => {
      const validPlant = {
        commonName: 'Valerian',
        botanicalName: 'Valeriana officinalis',
        fileSlug: 'valerian',
        properties: ['Sedative'],
        family: 'Valerianaceae'
      };

      expect(isValidPlant(validPlant)).toBe(true);
    });

    it('should reject plant without commonName', () => {
      const plant = {
        botanicalName: 'Valeriana officinalis',
        fileSlug: 'valerian'
      };

      expect(isValidPlant(plant)).toBe(false);
    });

    it('should reject plant with empty commonName', () => {
      const plant = {
        commonName: '',
        botanicalName: 'Valeriana officinalis',
        fileSlug: 'valerian'
      };

      expect(isValidPlant(plant)).toBe(false);
    });

    it('should reject plant without botanicalName', () => {
      const plant = {
        commonName: 'Valerian',
        fileSlug: 'valerian'
      };

      expect(isValidPlant(plant)).toBe(false);
    });

    it('should reject plant without fileSlug', () => {
      const plant = {
        commonName: 'Valerian',
        botanicalName: 'Valeriana officinalis'
      };

      expect(isValidPlant(plant)).toBe(false);
    });

    it('should reject plant with non-string commonName', () => {
      const plant = {
        commonName: 123,
        botanicalName: 'Valeriana officinalis',
        fileSlug: 'valerian'
      };

      expect(isValidPlant(plant)).toBe(false);
    });

    it('should reject null plant', () => {
      expect(isValidPlant(null)).toBe(false);
    });

    it('should reject undefined plant', () => {
      expect(isValidPlant(undefined)).toBe(false);
    });

    it('should reject non-object plant', () => {
      expect(isValidPlant('string')).toBe(false);
      expect(isValidPlant(123)).toBe(false);
      expect(isValidPlant(true)).toBe(false);
    });

    it('should accept plant with optional fields', () => {
      const plant = {
        commonName: 'Valerian',
        botanicalName: 'Valeriana officinalis',
        fileSlug: 'valerian',
        danishName: 'Baldrian',
        frenchName: 'Valériane',
        properties: ['Sedative', 'Antispasmodic'],
        family: 'Valerianaceae',
        status: 'complete'
      };

      expect(isValidPlant(plant)).toBe(true);
    });
  });

  describe('Plant Name Sanitization', () => {
    it('should sanitize plant names with XSS attempts', () => {
      const dangerousPlant = {
        commonName: '<script>alert("xss")</script>',
        botanicalName: 'Malicious plantus',
        fileSlug: 'malicious'
      };

      expect(isValidPlant(dangerousPlant)).toBe(true); // Structure is valid

      const escaped = Utils.escapeHtml(dangerousPlant.commonName);
      expect(escaped).not.toContain('<script>');
      expect(escaped).toContain('&lt;script&gt;');
    });

    it('should handle special characters in botanical names', () => {
      const plant = {
        commonName: "St. John's Wort",
        botanicalName: 'Hypericum perforatum',
        fileSlug: 'st-johns-wort'
      };

      expect(isValidPlant(plant)).toBe(true);

      const escaped = Utils.escapeHtml(plant.commonName);
      expect(escaped).toContain('&#039;'); // Apostrophe escaped
    });
  });
});
