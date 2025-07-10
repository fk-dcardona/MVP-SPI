'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Package,
  TrendingUp,
  Shield,
  FileText,
  BarChart3,
  Upload,
  Users,
  Settings,
  LogOut,
  Search,
  Home,
  Bell,
  Zap,
  Plus,
  FileUp,
  Database,
  AlertCircle,
  Activity,
  Filter,
  Download,
  RefreshCw,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface CommandPaletteProps {
  onClose?: () => void;
}

interface Command {
  id: string;
  title: string;
  description?: string;
  icon: any;
  shortcut?: string;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette({ onClose }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  // Track recent commands for quick access
  const [recentCommands, setRecentCommands] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('streamliner-recent-commands');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Handle opening with Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const executeCommand = useCallback((command: Command) => {
    // Track recent commands
    const newRecent = [command.id, ...recentCommands.filter(id => id !== command.id)].slice(0, 5);
    setRecentCommands(newRecent);
    localStorage.setItem('streamliner-recent-commands', JSON.stringify(newRecent));
    
    // Execute the command
    command.action();
    
    // Close palette
    setOpen(false);
    if (onClose) onClose();
  }, [recentCommands, onClose]);

  // Define all available commands
  const commands: Command[] = [
    // Navigation Commands
    {
      id: 'nav-home',
      title: 'Go to Dashboard',
      icon: Home,
      shortcut: '⌘H',
      action: () => router.push('/dashboard'),
      keywords: ['home', 'main', 'overview'],
    },
    {
      id: 'nav-inventory',
      title: 'View Inventory',
      icon: Package,
      shortcut: '⌘I',
      action: () => router.push('/dashboard/inventory'),
      keywords: ['stock', 'products', 'items'],
    },
    {
      id: 'nav-sales',
      title: 'View Sales',
      icon: TrendingUp,
      shortcut: '⌘S',
      action: () => router.push('/dashboard/sales'),
      keywords: ['revenue', 'orders', 'transactions'],
    },
    {
      id: 'nav-suppliers',
      title: 'Manage Suppliers',
      icon: Users,
      action: () => router.push('/dashboard/suppliers'),
      keywords: ['vendors', 'partners'],
    },
    {
      id: 'nav-documents',
      title: 'Browse Documents',
      icon: FileText,
      action: () => router.push('/dashboard/documents'),
      keywords: ['files', 'reports', 'papers'],
    },
    {
      id: 'nav-control-tower',
      title: 'Control Tower',
      icon: Shield,
      shortcut: '⌘T',
      action: () => router.push('/dashboard/control-tower'),
      keywords: ['agents', 'monitoring', 'alerts'],
    },
    {
      id: 'nav-analytics',
      title: 'Analytics Dashboard',
      icon: BarChart3,
      shortcut: '⌘A',
      action: () => router.push('/dashboard/analytics'),
      keywords: ['reports', 'insights', 'metrics'],
    },

    // Quick Actions
    {
      id: 'action-upload',
      title: 'Upload CSV Data',
      description: 'Import inventory or sales data',
      icon: Upload,
      shortcut: '⌘U',
      action: () => router.push('/dashboard/upload'),
      keywords: ['import', 'csv', 'file', 'data'],
    },
    {
      id: 'action-new-alert',
      title: 'Create Alert Rule',
      description: 'Set up a new monitoring alert',
      icon: Plus,
      action: () => {
        router.push('/dashboard/control-tower?action=new-alert');
        toast({
          title: 'Create Alert',
          description: 'Opening alert configuration...',
        });
      },
      keywords: ['rule', 'monitor', 'notification'],
    },
    {
      id: 'action-refresh-data',
      title: 'Refresh All Data',
      description: 'Force refresh all dashboard data',
      icon: RefreshCw,
      shortcut: '⌘R',
      action: () => {
        window.location.reload();
        toast({
          title: 'Refreshing',
          description: 'Updating all data...',
        });
      },
      keywords: ['reload', 'update', 'sync'],
    },
    {
      id: 'action-export',
      title: 'Export Current View',
      description: 'Download data as CSV',
      icon: Download,
      shortcut: '⌘E',
      action: () => {
        toast({
          title: 'Export Started',
          description: 'Preparing your download...',
        });
      },
      keywords: ['download', 'csv', 'save'],
    },

    // Search & Filter
    {
      id: 'search-global',
      title: 'Global Search',
      description: 'Search across all data',
      icon: Search,
      shortcut: '⌘/',
      action: () => {
        toast({
          title: 'Search Mode',
          description: 'Global search activated',
        });
      },
      keywords: ['find', 'lookup', 'query'],
    },
    {
      id: 'filter-active',
      title: 'Active Filters',
      description: 'View and manage filters',
      icon: Filter,
      action: () => {
        toast({
          title: 'Filter Panel',
          description: 'Opening filter management...',
        });
      },
      keywords: ['sort', 'criteria', 'refine'],
    },

    // Speed Actions (Streamliner Special)
    {
      id: 'speed-mode',
      title: 'Toggle Speed Mode',
      description: 'Enable/disable speed optimizations',
      icon: Zap,
      shortcut: '⌘⇧S',
      action: () => {
        const speedMode = localStorage.getItem('streamliner-speed-mode') !== 'true';
        localStorage.setItem('streamliner-speed-mode', speedMode.toString());
        toast({
          title: speedMode ? 'Speed Mode Enabled' : 'Speed Mode Disabled',
          description: speedMode ? 'All animations disabled for maximum speed' : 'Normal mode restored',
        });
      },
      keywords: ['fast', 'quick', 'performance'],
    },
    {
      id: 'speed-upload',
      title: 'Quick Upload',
      description: 'Fastest way to import data',
      icon: FileUp,
      shortcut: '⌘⇧U',
      action: () => {
        router.push('/dashboard/upload?mode=quick');
        toast({
          title: 'Quick Upload',
          description: 'Streamlined upload mode activated',
        });
      },
      keywords: ['fast', 'import', 'rapid'],
    },

    // System Commands
    {
      id: 'system-settings',
      title: 'Settings',
      icon: Settings,
      shortcut: '⌘,',
      action: () => router.push('/dashboard/settings'),
      keywords: ['preferences', 'config', 'options'],
    },
    {
      id: 'system-notifications',
      title: 'View Notifications',
      icon: Bell,
      action: () => {
        toast({
          title: 'Notifications',
          description: 'Opening notification center...',
        });
      },
      keywords: ['alerts', 'messages', 'updates'],
    },
    {
      id: 'system-activity',
      title: 'Activity Log',
      icon: Activity,
      action: () => router.push('/dashboard/activity'),
      keywords: ['history', 'log', 'timeline'],
    },
    {
      id: 'system-help',
      title: 'Help & Documentation',
      icon: AlertCircle,
      shortcut: '⌘?',
      action: () => {
        window.open('/docs', '_blank');
      },
      keywords: ['guide', 'docs', 'support'],
    },
    {
      id: 'system-logout',
      title: 'Sign Out',
      icon: LogOut,
      action: () => {
        router.push('/logout');
      },
      keywords: ['exit', 'leave', 'signout'],
    },
  ];

  // Filter commands based on search
  const filteredCommands = commands.filter(command => {
    const searchLower = search.toLowerCase();
    return (
      command.title.toLowerCase().includes(searchLower) ||
      command.description?.toLowerCase().includes(searchLower) ||
      command.keywords?.some(keyword => keyword.toLowerCase().includes(searchLower))
    );
  });

  // Get recent commands
  const recentCommandObjects = recentCommands
    .map(id => commands.find(c => c.id === id))
    .filter(Boolean) as Command[];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder="Type a command or search..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {recentCommandObjects.length > 0 && search === '' && (
          <>
            <CommandGroup heading="Recent">
              {recentCommandObjects.map((command) => (
                <CommandItem
                  key={command.id}
                  onSelect={() => executeCommand(command)}
                  className="cursor-pointer"
                >
                  <command.icon className="mr-2 h-4 w-4" />
                  <span className="flex-1">{command.title}</span>
                  {command.shortcut && (
                    <kbd className="ml-auto text-xs text-muted-foreground">
                      {command.shortcut}
                    </kbd>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Navigation">
          {filteredCommands
            .filter(cmd => cmd.id.startsWith('nav-'))
            .map((command) => (
              <CommandItem
                key={command.id}
                onSelect={() => executeCommand(command)}
                className="cursor-pointer"
              >
                <command.icon className="mr-2 h-4 w-4" />
                <div className="flex-1">
                  <div>{command.title}</div>
                  {command.description && (
                    <div className="text-xs text-muted-foreground">
                      {command.description}
                    </div>
                  )}
                </div>
                {command.shortcut && (
                  <kbd className="ml-auto text-xs text-muted-foreground">
                    {command.shortcut}
                  </kbd>
                )}
              </CommandItem>
            ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          {filteredCommands
            .filter(cmd => cmd.id.startsWith('action-') || cmd.id.startsWith('speed-'))
            .map((command) => (
              <CommandItem
                key={command.id}
                onSelect={() => executeCommand(command)}
                className="cursor-pointer"
              >
                <command.icon className="mr-2 h-4 w-4" />
                <div className="flex-1">
                  <div>{command.title}</div>
                  {command.description && (
                    <div className="text-xs text-muted-foreground">
                      {command.description}
                    </div>
                  )}
                </div>
                {command.shortcut && (
                  <kbd className="ml-auto text-xs text-muted-foreground">
                    {command.shortcut}
                  </kbd>
                )}
              </CommandItem>
            ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="System">
          {filteredCommands
            .filter(cmd => cmd.id.startsWith('system-') || cmd.id.startsWith('search-') || cmd.id.startsWith('filter-'))
            .map((command) => (
              <CommandItem
                key={command.id}
                onSelect={() => executeCommand(command)}
                className="cursor-pointer"
              >
                <command.icon className="mr-2 h-4 w-4" />
                <div className="flex-1">
                  <div>{command.title}</div>
                  {command.description && (
                    <div className="text-xs text-muted-foreground">
                      {command.description}
                    </div>
                  )}
                </div>
                {command.shortcut && (
                  <kbd className="ml-auto text-xs text-muted-foreground">
                    {command.shortcut}
                  </kbd>
                )}
              </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}