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

export function getRoleLabel(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1)
}