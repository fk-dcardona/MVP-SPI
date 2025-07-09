import { getRoleColor, getRoleBadgeColor, getRoleDisplayName, formatUserInitials } from '@/lib/auth/utils'

describe('Auth Utils', () => {
  describe('getRoleColor', () => {
    it('should return correct color for admin role', () => {
      expect(getRoleColor('admin')).toBe('bg-purple-500 text-white')
    })

    it('should return correct color for manager role', () => {
      expect(getRoleColor('manager')).toBe('bg-blue-500 text-white')
    })

    it('should return correct color for analyst role', () => {
      expect(getRoleColor('analyst')).toBe('bg-green-500 text-white')
    })

    it('should return default color for unknown role', () => {
      expect(getRoleColor('unknown')).toBe('bg-gray-500 text-white')
    })
  })

  describe('getRoleBadgeColor', () => {
    it('should return correct badge color for admin role', () => {
      expect(getRoleBadgeColor('admin')).toBe('bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200')
    })

    it('should return correct badge color for manager role', () => {
      expect(getRoleBadgeColor('manager')).toBe('bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200')
    })

    it('should return correct badge color for analyst role', () => {
      expect(getRoleBadgeColor('analyst')).toBe('bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200')
    })

    it('should return default badge color for unknown role', () => {
      expect(getRoleBadgeColor('unknown')).toBe('bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200')
    })
  })

  describe('getRoleDisplayName', () => {
    it('should return Administrator for admin role', () => {
      expect(getRoleDisplayName('admin')).toBe('Administrator')
    })

    it('should return Manager for manager role', () => {
      expect(getRoleDisplayName('manager')).toBe('Manager')
    })

    it('should return Analyst for analyst role', () => {
      expect(getRoleDisplayName('analyst')).toBe('Analyst')
    })

    it('should capitalize unknown roles', () => {
      expect(getRoleDisplayName('custom')).toBe('Custom')
    })
  })

  describe('formatUserInitials', () => {
    it('should return U for null name', () => {
      expect(formatUserInitials(null)).toBe('U')
    })

    it('should return first letter for single name', () => {
      expect(formatUserInitials('John')).toBe('J')
    })

    it('should return first and last initials for full name', () => {
      expect(formatUserInitials('John Doe')).toBe('JD')
    })

    it('should handle multiple middle names', () => {
      expect(formatUserInitials('John Michael Robert Doe')).toBe('JD')
    })

    it('should handle extra spaces', () => {
      expect(formatUserInitials('  John   Doe  ')).toBe('JD')
    })
  })
})