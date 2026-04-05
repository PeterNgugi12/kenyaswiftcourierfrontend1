import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (value: number | string | undefined): string => {
  if (value === undefined || value === null) return 'KES 0';
  
  // Convert to number if it's a string
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) : value;
  
  // Check if it's a valid number
  if (isNaN(num)) return 'KES 0';
  
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatNumber = (value: number | string | undefined): string => {
  if (value === undefined || value === null) return '0';
  
  const num = typeof value === 'string' ? parseInt(value) : value;
  
  if (isNaN(num)) return '0';
  
  return new Intl.NumberFormat('en-KE').format(num);
};

export const formatDate = (date: string | Date, format: string = 'MMM yyyy'): string => {
  if (!date) return '—';
  
  const d = new Date(date);
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  if (format === 'MMM yyyy') {
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  }
  
  if (format === 'dd MMM yyyy') {
    return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }
  
  return d.toLocaleDateString();
};

// Add formatTime function for displaying time only
export const formatTime = (date: string | Date): string => {
  if (!date) return '—';
  
  const d = new Date(date);
  
  return d.toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// Add formatDateTime function for full date and time
export const formatDateTime = (date: string | Date): string => {
  if (!date) return '—';
  
  const d = new Date(date);
  
  return d.toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// Add function to get initials from name
export const getInitials = (name: string): string => {
  if (!name) return '?';
  
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

// Add function to format phone number
export const formatPhone = (phone: string): string => {
  if (!phone) return '—';
  
  // Format Kenyan phone numbers
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('254') && cleaned.length === 12) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }
  
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `+254 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  
  return phone;
};

// Add function to truncate text
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (!text || text.length <= maxLength) return text;
  
  return text.slice(0, maxLength) + '...';
};

// Add function to get status badge color
export const getStatusColor = (status: string): string => {
  const statusMap: Record<string, string> = {
    active: 'badge-success',
    inactive: 'badge-danger',
    pending: 'badge-warning',
    in_transit: 'badge-info',
    arrived: 'badge-success',
    scheduled: 'badge-warning',
    cancelled: 'badge-danger',
    delivered: 'badge-success',
    paid: 'badge-success',
    unpaid: 'badge-danger',
    maintenance: 'badge-warning',
    sold: 'badge-danger'
  };
  
  return statusMap[status] || 'badge-secondary';
};
