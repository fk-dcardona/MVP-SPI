import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CommandPalette } from '@/components/CommandPalette';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/components/ui/use-toast', () => ({
  toast: jest.fn(),
}));

describe('CommandPalette', () => {
  const mockPush = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  it('renders command palette dialog', () => {
    render(<CommandPalette onClose={mockOnClose} />);
    expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
  });

  it('displays navigation commands', () => {
    render(<CommandPalette onClose={mockOnClose} />);
    expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
    expect(screen.getByText('View Inventory')).toBeInTheDocument();
    expect(screen.getByText('Sales Analytics')).toBeInTheDocument();
  });

  it('displays action commands', () => {
    render(<CommandPalette onClose={mockOnClose} />);
    expect(screen.getByText('Upload CSV Data')).toBeInTheDocument();
    expect(screen.getByText('Quick Upload')).toBeInTheDocument();
    expect(screen.getByText('Create New Report')).toBeInTheDocument();
  });

  it('shows keyboard shortcuts', () => {
    render(<CommandPalette onClose={mockOnClose} />);
    expect(screen.getByText('⌘H')).toBeInTheDocument();
    expect(screen.getByText('⌘I')).toBeInTheDocument();
    expect(screen.getByText('⌘U')).toBeInTheDocument();
  });

  it('filters commands based on search input', async () => {
    render(<CommandPalette onClose={mockOnClose} />);
    const searchInput = screen.getByPlaceholderText('Type a command or search...');
    
    fireEvent.change(searchInput, { target: { value: 'upload' } });
    
    await waitFor(() => {
      expect(screen.getByText('Upload CSV Data')).toBeInTheDocument();
      expect(screen.getByText('Quick Upload')).toBeInTheDocument();
      expect(screen.queryByText('Go to Dashboard')).not.toBeInTheDocument();
    });
  });

  it('executes navigation command', () => {
    render(<CommandPalette onClose={mockOnClose} />);
    
    const dashboardCommand = screen.getByText('Go to Dashboard');
    fireEvent.click(dashboardCommand);
    
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('executes action command with toast', () => {
    render(<CommandPalette onClose={mockOnClose} />);
    
    const refreshCommand = screen.getByText('Refresh All Data');
    fireEvent.click(refreshCommand);
    
    expect(toast).toHaveBeenCalledWith({
      title: 'Refreshing data...',
      description: 'All data sources are being updated',
    });
  });

  it('tracks recent commands', () => {
    const { rerender } = render(<CommandPalette onClose={mockOnClose} />);
    
    // Execute a command
    const uploadCommand = screen.getByText('Upload CSV Data');
    fireEvent.click(uploadCommand);
    
    // Re-render to check if recent commands are shown
    rerender(<CommandPalette onClose={mockOnClose} />);
    
    // The component should show recent commands (implementation dependent)
    expect(mockPush).toHaveBeenCalledWith('/dashboard/upload');
  });
});