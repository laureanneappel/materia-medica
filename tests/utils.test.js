/**
 * Tests for utils.js utility functions
 * Focus on critical security and validation functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Utils.escapeHtml', () => {
  it('should escape < and > characters', () => {
    const result = Utils.escapeHtml('<script>');
    expect(result).toBe('&lt;script&gt;');
  });

  it('should escape & character', () => {
    const result = Utils.escapeHtml('Ben & Jerry');
    expect(result).toBe('Ben &amp; Jerry');
  });

  it('should escape quotes', () => {
    expect(Utils.escapeHtml('"double"')).toBe('&quot;double&quot;');
    expect(Utils.escapeHtml("'single'")).toBe('&#039;single&#039;');
  });

  it('should handle XSS attack attempts', () => {
    const xssAttempts = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert(1)>',
      '<svg onload=alert(1)>',
      'javascript:alert(1)',
      '<iframe src="javascript:alert(1)">',
    ];

    xssAttempts.forEach(attack => {
      const result = Utils.escapeHtml(attack);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });
  });

  it('should handle empty string', () => {
    expect(Utils.escapeHtml('')).toBe('');
  });

  it('should handle null and undefined', () => {
    expect(Utils.escapeHtml(null)).toBe('');
    expect(Utils.escapeHtml(undefined)).toBe('');
  });

  it('should handle non-string types', () => {
    expect(Utils.escapeHtml(123)).toBe('');
    expect(Utils.escapeHtml(true)).toBe('');
    expect(Utils.escapeHtml({})).toBe('');
    expect(Utils.escapeHtml([])).toBe('');
  });

  it('should escape multiple dangerous characters in one string', () => {
    const dangerous = '<div onclick="alert(\'XSS\')" data-value="test">Content & more</div>';
    const result = Utils.escapeHtml(dangerous);

    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
    expect(result).toContain('&quot;');
    expect(result).toContain('&#039;');
    expect(result).toContain('&amp;');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });

  it('should escape plant names with special characters', () => {
    // Real-world test case for plant database
    const plantName = "St. John's Wort & Valerian <root>";
    const result = Utils.escapeHtml(plantName);

    expect(result).toBe("St. John&#039;s Wort &amp; Valerian &lt;root&gt;");
  });
});

describe('Utils.plantUrl', () => {
  it('should build the plant page address', () => {
    expect(Utils.plantUrl('hawthorn')).toBe('plant.html?p=hawthorn');
  });

  it('should encode unusual characters', () => {
    expect(Utils.plantUrl('a b&c')).toBe('plant.html?p=a%20b%26c');
  });
});
