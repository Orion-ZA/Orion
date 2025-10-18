import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import ReportsManagement from '../components/admin/ReportsManagement';
import SuccessPopup from '../components/SuccessPopup';

// Mock Firebase
jest.mock('../firebaseConfig', () => ({
  db: {}
}));

// Mock Firebase Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(() => ({ id: 'mock-doc-ref' })),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  where: jest.fn()
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Flag: () => <div data-testid="flag-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  XCircle: () => <div data-testid="x-circle-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  User: () => <div data-testid="user-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />
}));

// Mock SuccessPopup
jest.mock('../components/SuccessPopup', () => {
  return function MockSuccessPopup({ isVisible, message, onClose }) {
    return isVisible ? (
      <div data-testid="success-popup">
        <div data-testid="success-message">{message}</div>
        <button onClick={onClose} data-testid="close-popup">Close</button>
      </div>
    ) : null;
  };
});

// Mock window.location.reload
const mockReload = jest.fn();
Object.defineProperty(window, 'location', {
  value: {
    reload: mockReload
  },
  writable: true
});

describe('ReportsManagement', () => {
  const mockReports = [
    {
      id: '1',
      type: 'trail',
      category: 'inappropriate_content',
      description: 'Test report description',
      status: 'pending',
      reporterId: 'user123',
      trailId: 'trail456',
      trailName: 'Test Trail',
      createdAt: new Date('2023-01-01'),
      priority: 'high'
    },
    {
      id: '2',
      type: 'review',
      category: 'spam',
      description: 'Another test report',
      status: 'resolved',
      reporterId: 'user789',
      createdAt: new Date('2023-01-02'),
      priority: 'low'
    }
  ];

  const mockSnapshot = {
    docs: mockReports.map(report => ({
      id: report.id,
      data: () => ({
        ...report,
        createdAt: {
          toDate: () => report.createdAt
        }
      })
    }))
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getDocs.mockResolvedValue(mockSnapshot);
    collection.mockReturnValue('mockCollection');
    query.mockReturnValue('mockQuery');
    orderBy.mockReturnValue('mockOrderBy');
    doc.mockReturnValue({ id: 'mock-doc-ref' });
  });

  it('renders loading state initially', async () => {
    getDocs.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<ReportsManagement />);
    
    expect(screen.getByText('Loading reports...')).toBeInTheDocument();
  });

  it('renders reports after loading', async () => {
    render(<ReportsManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('Reports Management')).toBeInTheDocument();
    });
    
    expect(screen.getByText('2 Total Reports')).toBeInTheDocument();
    expect(screen.getByText('1 Pending')).toBeInTheDocument();
    expect(screen.getByText('1 Resolved')).toBeInTheDocument();
  });

  it('renders individual reports correctly', async () => {
    render(<ReportsManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('INAPPROPRIATE CONTENT')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Test report description')).toBeInTheDocument();
    expect(screen.getByText('Reporter: user123')).toBeInTheDocument();
    expect(screen.getByText('Trail: Test Trail')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });

  it('filters reports by status', async () => {
    render(<ReportsManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('2 Total Reports')).toBeInTheDocument();
    });
    
    const statusFilter = screen.getByLabelText('Status:');
    fireEvent.change(statusFilter, { target: { value: 'pending' } });
    
    expect(screen.getByText('INAPPROPRIATE CONTENT')).toBeInTheDocument();
    expect(screen.queryByText('Another test report')).not.toBeInTheDocument();
  });

  it('filters reports by type', async () => {
    render(<ReportsManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('2 Total Reports')).toBeInTheDocument();
    });
    
    const typeFilter = screen.getByLabelText('Type:');
    fireEvent.change(typeFilter, { target: { value: 'trail' } });
    
    expect(screen.getByText('Test report description')).toBeInTheDocument();
    expect(screen.queryByText('Another test report')).not.toBeInTheDocument();
  });

  it('shows empty state when no reports match filters', async () => {
    render(<ReportsManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('2 Total Reports')).toBeInTheDocument();
    });
    
    const statusFilter = screen.getByLabelText('Status:');
    fireEvent.change(statusFilter, { target: { value: 'reviewed' } });
    
    expect(screen.getByText('No reports found matching the current filters')).toBeInTheDocument();
  });

  it('updates report status when status select changes', async () => {
    const mockUpdateDoc = updateDoc;
    mockUpdateDoc.mockResolvedValue();
    
    render(<ReportsManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('2 Total Reports')).toBeInTheDocument();
    });
    
    const statusSelects = screen.getAllByRole('combobox');
    const reportStatusSelect = statusSelects.find(select => 
      select.closest('.report-actions') !== null
    );
    
    fireEvent.change(reportStatusSelect, { target: { value: 'reviewed' } });
    
    await waitFor(() => {
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          status: 'reviewed',
          updatedAt: expect.any(Date)
        })
      );
    });
  });

  it('deletes report when delete button is clicked', async () => {
    const mockDeleteDoc = deleteDoc;
    mockDeleteDoc.mockResolvedValue();
    
    render(<ReportsManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('2 Total Reports')).toBeInTheDocument();
    });
    
    const deleteButtons = screen.getAllByTitle('Delete Report');
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(mockDeleteDoc).toHaveBeenCalled();
    });
  });

  it('shows success popup after successful operations', async () => {
    const mockUpdateDoc = updateDoc;
    mockUpdateDoc.mockResolvedValue();
    
    render(<ReportsManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('2 Total Reports')).toBeInTheDocument();
    });
    
    const statusSelects = screen.getAllByRole('combobox');
    const reportStatusSelect = statusSelects.find(select => 
      select.closest('.report-actions') !== null
    );
    
    fireEvent.change(reportStatusSelect, { target: { value: 'reviewed' } });
    
    await waitFor(() => {
      expect(screen.getByTestId('success-popup')).toBeInTheDocument();
      expect(screen.getByText('Report status updated to reviewed')).toBeInTheDocument();
    });
  });

  it('handles error state when fetch fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    getDocs.mockRejectedValue(new Error('Fetch failed'));
    
    render(<ReportsManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch reports')).toBeInTheDocument();
    });
    
    expect(consoleSpy).toHaveBeenCalledWith('Error fetching reports:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('handles retry button click in error state', async () => {
    getDocs.mockRejectedValue(new Error('Fetch failed'));
    
    render(<ReportsManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Retry'));
    expect(mockReload).toHaveBeenCalled();
  });

  it('handles error when updating report status', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockUpdateDoc = updateDoc;
    mockUpdateDoc.mockRejectedValue(new Error('Update failed'));
    
    render(<ReportsManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('2 Total Reports')).toBeInTheDocument();
    });
    
    const statusSelects = screen.getAllByRole('combobox');
    const reportStatusSelect = statusSelects.find(select => 
      select.closest('.report-actions') !== null
    );
    
    fireEvent.change(reportStatusSelect, { target: { value: 'reviewed' } });
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error updating report status:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });

  it('handles error when deleting report', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockDeleteDoc = deleteDoc;
    mockDeleteDoc.mockRejectedValue(new Error('Delete failed'));
    
    render(<ReportsManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('2 Total Reports')).toBeInTheDocument();
    });
    
    const deleteButtons = screen.getAllByTitle('Delete Report');
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error deleting report:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });

  it('formats dates correctly', async () => {
    render(<ReportsManagement />);
    
    await waitFor(() => {
      expect(screen.getAllByText(/Reported:/)).toHaveLength(2);
    });
    
    // Check that the date is formatted (should contain month abbreviation)
    const dateTexts = screen.getAllByText(/Reported:/);
    expect(dateTexts[0].textContent).toMatch(/Jan/);
    expect(dateTexts[1].textContent).toMatch(/Jan/);
  });

  it('displays correct status badges with icons', async () => {
    render(<ReportsManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('2 Total Reports')).toBeInTheDocument();
    });
    
    // Check for status badges
    expect(screen.getByText('PENDING')).toBeInTheDocument();
    expect(screen.getByText('RESOLVED')).toBeInTheDocument();
    
    // Check for status icons
    expect(screen.getAllByTestId('clock-icon')).toHaveLength(2); // One for pending status, one for pending count
    expect(screen.getAllByTestId('check-circle-icon')).toHaveLength(2); // One for resolved status, one for resolved count
  });

  it('displays correct type icons', async () => {
    render(<ReportsManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('2 Total Reports')).toBeInTheDocument();
    });
    
    // Check for type icons
    expect(screen.getAllByTestId('flag-icon')).toHaveLength(3); // Two for trail types, one for stats
    expect(screen.getAllByTestId('user-icon')).toHaveLength(3); // Two for reporter info, one for review type
  });

  it('shows additional details when available', async () => {
    const reportWithDetails = {
      ...mockReports[0],
      additionalDetails: 'This is additional information'
    };
    
    const mockSnapshotWithDetails = {
      docs: [{
        id: reportWithDetails.id,
        data: () => ({
          ...reportWithDetails,
          createdAt: {
            toDate: () => reportWithDetails.createdAt
          }
        })
      }]
    };
    
    getDocs.mockResolvedValue(mockSnapshotWithDetails);
    
    render(<ReportsManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('This is additional information')).toBeInTheDocument();
    });
  });

  it('handles reports without optional fields gracefully', async () => {
    const minimalReport = {
      id: '3',
      type: 'general',
      description: 'Minimal report',
      status: 'pending',
      createdAt: new Date('2023-01-03')
    };
    
    const mockSnapshotMinimal = {
      docs: [{
        id: minimalReport.id,
        data: () => ({
          ...minimalReport,
          createdAt: {
            toDate: () => minimalReport.createdAt
          }
        })
      }]
    };
    
    getDocs.mockResolvedValue(mockSnapshotMinimal);
    
    render(<ReportsManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('Minimal report')).toBeInTheDocument();
      expect(screen.getByText('Reporter: Anonymous')).toBeInTheDocument();
      expect(screen.getByText('UNKNOWN CATEGORY')).toBeInTheDocument();
    });
  });
});
