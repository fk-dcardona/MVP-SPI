import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts() {
  const router = useRouter();
  const { toast } = useToast();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const shortcuts: ShortcutConfig[] = [
    {
      key: 'k',
      metaKey: true,
      ctrlKey: true,
      action: () => setIsCommandPaletteOpen(true),
      description: 'Open command palette'
    },
    {
      key: 'u',
      metaKey: true,
      ctrlKey: true,
      action: () => router.push('/dashboard/upload'),
      description: 'Quick upload'
    },
    {
      key: '/',
      metaKey: true,
      ctrlKey: true,
      action: () => toggleHelp(),
      description: 'Toggle help'
    },
    {
      key: '1',
      metaKey: true,
      ctrlKey: true,
      action: () => router.push('/dashboard/inventory'),
      description: 'Go to Inventory'
    },
    {
      key: '2',
      metaKey: true,
      ctrlKey: true,
      action: () => router.push('/dashboard/sales'),
      description: 'Go to Sales'
    },
    {
      key: '3',
      metaKey: true,
      ctrlKey: true,
      action: () => router.push('/dashboard/agents'),
      description: 'Go to Control Tower'
    },
    {
      key: '4',
      metaKey: true,
      ctrlKey: true,
      action: () => router.push('/dashboard/suppliers'),
      description: 'Go to Suppliers'
    },
    {
      key: '5',
      metaKey: true,
      ctrlKey: true,
      action: () => router.push('/dashboard/documents'),
      description: 'Go to Documents'
    },
    {
      key: '6',
      metaKey: true,
      ctrlKey: true,
      action: () => router.push('/dashboard/analytics'),
      description: 'Go to Analytics'
    },
    {
      key: 'Escape',
      action: () => handleEscape(),
      description: 'Close modals/overlays'
    }
  ];

  const toggleHelp = useCallback(() => {
    const shortcutList = shortcuts.map(shortcut => {
      const keys = [
        (shortcut.metaKey || shortcut.ctrlKey) ? '⌘' : '',
        shortcut.shiftKey ? '⇧' : '',
        shortcut.key.toUpperCase()
      ].join('');
      
      return `${shortcut.description}: ${keys}`;
    }).join('\n');

    toast({
      title: 'Keyboard Shortcuts',
      description: shortcutList
    });
  }, [shortcuts, toast]);

  const handleEscape = useCallback(() => {
    // Close any open modals or overlays
    setIsCommandPaletteOpen(false);
    // Dispatch custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('escape-pressed'));
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is typing in an input field
      const target = event.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || 
                      target.tagName === 'TEXTAREA' || 
                      target.contentEditable === 'true';

      if (isTyping && event.key !== 'Escape') {
        return;
      }

      // Check for matching shortcuts
      const matchingShortcut = shortcuts.find(shortcut => {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrlKey ? (event.ctrlKey || event.metaKey) : true;
        const metaMatch = shortcut.metaKey ? (event.metaKey || event.ctrlKey) : true;
        const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;

        return keyMatch && ctrlMatch && metaMatch && shiftMatch;
      });

      if (matchingShortcut) {
        event.preventDefault();
        matchingShortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);

  return {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    shortcuts
  };
}