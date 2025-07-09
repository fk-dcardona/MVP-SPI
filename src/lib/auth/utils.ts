export function getRoleColor(role: string) {
  switch (role) {
    case 'admin':
      return 'bg-purple-500 text-white'
    case 'manager':
      return 'bg-blue-500 text-white'
    case 'analyst':
      return 'bg-green-500 text-white'
    default:
      return 'bg-gray-500 text-white'
  }
}

export function getRoleBadgeColor(role: string) {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    case 'manager':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'analyst':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
}

export function getRoleLabel(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

export function getRoleDisplayName(role: string) {
  switch (role) {
    case 'admin':
      return 'Administrator'
    case 'manager':
      return 'Manager'
    case 'analyst':
      return 'Analyst'
    default:
      return role.charAt(0).toUpperCase() + role.slice(1)
  }
}

export function formatUserInitials(fullName: string | null): string {
  if (!fullName) return 'U'
  
  const names = fullName.trim().split(' ')
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase()
  }
  
  return names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase()
}