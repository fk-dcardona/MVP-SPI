'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

export function Breadcrumbs() {
  const pathname = usePathname();
  
  // Split pathname into segments
  const segments = pathname.split('/').filter(Boolean);
  
  // Generate breadcrumb items
  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    
    return {
      href,
      label,
      isLast: index === segments.length - 1
    };
  });

  return (
    <nav className="flex items-center space-x-2 text-sm">
      {/* Home */}
      <Link
        href="/"
        className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>

      {breadcrumbs.length > 0 && (
        <ChevronRight className="h-4 w-4 text-gray-400" />
      )}

      {/* Breadcrumb items */}
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
          )}
          
          {crumb.isLast ? (
            <span className="font-medium text-gray-900">
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}