import { describe, expect, it } from 'vitest'

import {
  generateSessionCode,
  isValidSessionCode,
  isValidSessionPassword,
  normalizeSessionCode,
} from './session'

describe('session', () => {
  describe('generateSessionCode', () => {
    it('génère une string de 6 chiffres', () => {
      const code = generateSessionCode()
      expect(code).toMatch(/^\d{6}$/)
    })

    it('génère des codes qui restent dans l’intervalle 100000..999999', () => {
      for (let i = 0; i < 50; i++) {
        const code = generateSessionCode()
        const n = Number(code)
        expect(Number.isInteger(n)).toBe(true)
        expect(n).toBeGreaterThanOrEqual(100000)
        expect(n).toBeLessThanOrEqual(999999)
      }
    })
  })

  describe('normalizeSessionCode', () => {
    it('retire les caractères non numériques', () => {
      expect(normalizeSessionCode('12a-34b')).toBe('1234')
    })

    it('limite à 6 chiffres', () => {
      expect(normalizeSessionCode('1234567890')).toBe('123456')
    })

    it('gère les chaînes vides', () => {
      expect(normalizeSessionCode('')).toBe('')
    })
  })

  describe('isValidSessionCode', () => {
    it('valide exactement 6 chiffres', () => {
      expect(isValidSessionCode('123456')).toBe(true)
      expect(isValidSessionCode('000000')).toBe(true)
    })

    it('refuse si longueur != 6', () => {
      expect(isValidSessionCode('12345')).toBe(false)
      expect(isValidSessionCode('1234567')).toBe(false)
      expect(isValidSessionCode('')).toBe(false)
    })

    it('refuse si contient des non-chiffres', () => {
      expect(isValidSessionCode('12a456')).toBe(false)
      expect(isValidSessionCode('12 456')).toBe(false)
    })
  })

  describe('isValidSessionPassword', () => {
    it('par défaut, est identique au code de session (6 chiffres)', () => {
      expect(isValidSessionPassword('123456')).toBe(true)
      expect(isValidSessionPassword('abcdef')).toBe(false)
    })
  })
})
