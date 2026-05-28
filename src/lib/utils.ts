import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getPassportStatusLabel, isPassportFinalStage } from './passportStatusMessages';
import { resolveBackendFileUrl } from './config';

export function resolveStoredFileUrl(rawUrl?: string | null): string | null {
  return resolveBackendFileUrl(rawUrl);
}

/** Proxy file through admin API — works with localhost URLs stored in DB. */
export function getAdminFileProxyUrl(
  rawUrl: string,
  fileName: string,
  inline = false
): string {
  const params = new URLSearchParams({
    url: rawUrl,
    name: fileName || 'file',
  });
  if (inline) params.set('inline', '1');
  return `/api/download?${params.toString()}`;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount);
}

export function formatDate(date: Date | string, format: 'short' | 'long' | 'datetime' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'long') {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  }
  
  if (format === 'datetime') {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function generateApplicationNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `APP-${timestamp}-${random}`;
}

export function getStatusColor(status: string): string {
  // Normalize status to uppercase for consistent mapping
  const normalizedStatus = status?.toUpperCase() || '';
  
  const statusColors: Record<string, string> = {
    // Pending states
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    NEW: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    DRAFT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    SUBMITTED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    
    // In progress states
    UNDER_REVIEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    PROCESSING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    APPOINTMENT_BOOKED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    AT_EMBASSY: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    
    // Final states
    DECISION_MADE: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    COMPLETED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    
    // User status
    ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    BLOCKED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    PENDING_VERIFICATION: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  };
  
  return statusColors[normalizedStatus] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
}

export function formatStatusForEmail(status?: string): string {
  if (isPassportFinalStage(status)) {
    return getPassportStatusLabel(status);
  }
  return (status || '').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function isSuperAdmin(user: any): boolean {
  return user?.role === 'SUPER_ADMIN';
}

export function canViewAmounts(user: any): boolean {
  return isSuperAdmin(user);
}

export function downloadCSV(data: any[], filename: string): void {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        const stringValue = value === null || value === undefined ? '' : String(value);
        return `"${(stringValue || '').replace(/"/g, '""')}"`;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadFile(fileUrl: string, fileName: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const proxyUrl = getAdminFileProxyUrl(fileUrl, fileName, false);
      // Method 1: Use our download proxy API (most reliable)
      try {
        const response = await fetch(proxyUrl, {
          method: 'GET',
          credentials: 'same-origin',
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          
          // Create download link
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName;
          link.style.display = 'none';
          
          // Add to DOM, trigger download, then clean up
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up blob URL
          setTimeout(() => {
            window.URL.revokeObjectURL(blobUrl);
          }, 1000);
          
          resolve();
          return;
        }
      } catch (proxyError) {
        console.warn('Proxy download failed, trying direct methods:', proxyError);
      }
      
      // Method 2: Direct fetch + blob approach
      try {
        const response = await fetch(fileUrl, {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
          headers: {
            'Accept': '*/*',
          }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          
          // Create download link
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName;
          link.style.display = 'none';
          
          // Add to DOM, trigger download, then clean up
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up blob URL
          setTimeout(() => {
            window.URL.revokeObjectURL(blobUrl);
          }, 1000);
          
          resolve();
          return;
        }
      } catch (fetchError) {
        console.warn('Direct fetch failed, trying fallback:', fetchError);
      }
      
      // Method 3: Direct download with proper attributes
      try {
        const link = document.createElement('a');
        link.href = proxyUrl;
        link.download = fileName;
        link.style.display = 'none';
        
        // Add to DOM, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        resolve();
        return;
      } catch (directError) {
        console.warn('Direct download failed:', directError);
      }
      
      // Method 4: Final fallback - show user instruction
      console.error('All download methods failed');
      alert(`Unable to automatically download "${fileName}". Please right-click the "View" link and select "Save as" to download the file.`);
      resolve();
      
    } catch (error) {
      console.error('Download error:', error);
      alert(`Download failed for "${fileName}". Please try right-clicking the "View" link and selecting "Save as".`);
      resolve(); // Don't reject to prevent UI crashes
    }
  });
}

export function downloadFileWithFallback(fileUrl: string, fileName: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // Use the improved downloadFile function
      await downloadFile(fileUrl, fileName);
      resolve();
    } catch (error) {
      console.error('Download failed:', error);
      // If all methods fail, show user-friendly error
      alert(`Unable to download "${fileName}". Please try right-clicking the "View" link and selecting "Save as" to download the file.`);
      resolve(); // Don't reject, just show error message
    }
  });
}

export function getInitials(name: string): string {
  if (!name) return '';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}
