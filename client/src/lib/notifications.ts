import Swal from 'sweetalert2';

export const showNotification = {
  success: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'success',
      title,
      text,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      toast: true,
      position: 'top-end',
      background: 'rgba(255, 255, 255, 0.95)',
      customClass: {
        popup: 'swal-glass-popup',
        title: 'swal-title',
        htmlContainer: 'swal-text'
      }
    });
  },

  error: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'error',
      title,
      text,
      showConfirmButton: false,
      timer: 4000,
      timerProgressBar: true,
      toast: true,
      position: 'top-end',
      background: 'rgba(255, 255, 255, 0.95)',
      customClass: {
        popup: 'swal-glass-popup',
        title: 'swal-title',
        htmlContainer: 'swal-text'
      }
    });
  },

  info: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'info',
      title,
      text,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      toast: true,
      position: 'top-end',
      background: 'rgba(255, 255, 255, 0.95)',
      customClass: {
        popup: 'swal-glass-popup',
        title: 'swal-title',
        htmlContainer: 'swal-text'
      }
    });
  },

  warning: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'warning',
      title,
      text,
      showConfirmButton: false,
      timer: 3500,
      timerProgressBar: true,
      toast: true,
      position: 'top-end',
      background: 'rgba(255, 255, 255, 0.95)',
      customClass: {
        popup: 'swal-glass-popup',
        title: 'swal-title',
        htmlContainer: 'swal-text'
      }
    });
  },

  confirm: (title: string, text?: string) => {
    return Swal.fire({
      title,
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, proceed',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      background: 'rgba(255, 255, 255, 0.95)',
      backdrop: 'rgba(0, 0, 0, 0.4)',
      customClass: {
        popup: 'swal-glass-popup',
        title: 'swal-title',
        htmlContainer: 'swal-text',
        confirmButton: 'swal-confirm-btn',
        cancelButton: 'swal-cancel-btn'
      }
    });
  }
};

export const confirmAction = {
  delete: (itemName: string, itemType: string = 'item') => {
    return Swal.fire({
      title: `Delete ${itemType}?`,
      html: `Are you sure you want to delete <strong>"${itemName}"</strong>?<br><br>This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      background: 'rgba(255, 255, 255, 0.95)',
      backdrop: 'rgba(0, 0, 0, 0.4)',
      customClass: {
        popup: 'swal-glass-popup',
        title: 'swal-title',
        htmlContainer: 'swal-text',
        confirmButton: 'swal-confirm-btn swal-delete-btn',
        cancelButton: 'swal-cancel-btn'
      }
    });
  },

  clearAll: (dataType: string, count: number) => {
    return Swal.fire({
      title: `Clear All ${dataType}?`,
      html: `This will permanently delete <strong>${count} ${dataType.toLowerCase()}</strong>.<br><br><span style="color: #ef4444; font-weight: bold;">⚠️ This action cannot be undone!</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, clear all',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      background: 'rgba(255, 255, 255, 0.95)',
      backdrop: 'rgba(0, 0, 0, 0.4)',
      customClass: {
        popup: 'swal-glass-popup',
        title: 'swal-title',
        htmlContainer: 'swal-text',
        confirmButton: 'swal-confirm-btn swal-delete-btn',
        cancelButton: 'swal-cancel-btn'
      }
    });
  },

  logout: () => {
    return Swal.fire({
      title: 'Sign Out?',
      text: 'Are you sure you want to sign out of your account?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, sign out',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      background: 'rgba(255, 255, 255, 0.95)',
      backdrop: 'rgba(0, 0, 0, 0.4)',
      customClass: {
        popup: 'swal-glass-popup',
        title: 'swal-title',
        htmlContainer: 'swal-text',
        confirmButton: 'swal-confirm-btn',
        cancelButton: 'swal-cancel-btn'
      }
    });
  },

  saveSettings: () => {
    return Swal.fire({
      title: 'Save Settings?',
      text: 'Do you want to save the changes you made to settings?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Save Changes',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      background: 'rgba(255, 255, 255, 0.95)',
      backdrop: 'rgba(0, 0, 0, 0.4)',
      customClass: {
        popup: 'swal-glass-popup',
        title: 'swal-title',
        htmlContainer: 'swal-text',
        confirmButton: 'swal-confirm-btn swal-success-btn',
        cancelButton: 'swal-cancel-btn'
      }
    });
  },

  bulkAction: (action: string, count: number, itemType: string = 'items') => {
    return Swal.fire({
      title: `${action} ${count} ${itemType}?`,
      html: `Are you sure you want to ${action.toLowerCase()} <strong>${count} ${itemType}</strong>?<br><br>This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Yes, ${action.toLowerCase()}`,
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      background: 'rgba(255, 255, 255, 0.95)',
      backdrop: 'rgba(0, 0, 0, 0.4)',
      customClass: {
        popup: 'swal-glass-popup',
        title: 'swal-title',
        htmlContainer: 'swal-text',
        confirmButton: 'swal-confirm-btn swal-delete-btn',
        cancelButton: 'swal-cancel-btn'
      }
    });
  }
};

export const formatCurrency = (amount: number | string, currency: string = 'PHP'): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  const currencies: Record<string, { symbol: string; locale: string }> = {
    PHP: { symbol: '₱', locale: 'en-PH' },
    USD: { symbol: '$', locale: 'en-US' },
    EUR: { symbol: '€', locale: 'de-DE' },
    GBP: { symbol: '£', locale: 'en-GB' }
  };

  const currencyConfig = currencies[currency] || currencies.PHP;
  
  // For PHP, directly format with peso symbol to avoid locale issues
  if (currency === 'PHP') {
    return `₱${numAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }
  
  // For other currencies, use Intl.NumberFormat
  return new Intl.NumberFormat(currencyConfig.locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
};

export const formatCompactCurrency = (amount: number | string, currency: string = 'PHP'): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  const currencies: Record<string, { symbol: string; locale: string }> = {
    PHP: { symbol: '₱', locale: 'en-PH' },
    USD: { symbol: '$', locale: 'en-US' },
    EUR: { symbol: '€', locale: 'de-DE' },
    GBP: { symbol: '£', locale: 'en-GB' }
  };

  const currencyConfig = currencies[currency] || currencies.PHP;
  
  // For large numbers, use compact notation
  if (Math.abs(numAmount) >= 1000000) {
    return `${currencyConfig.symbol}${(numAmount / 1000000).toFixed(1)}M`;
  } else if (Math.abs(numAmount) >= 1000) {
    return `${currencyConfig.symbol}${(numAmount / 1000).toFixed(1)}K`;
  } else {
    return `${currencyConfig.symbol}${numAmount.toFixed(0)}`;
  }
};

export const formatCompactNumber = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // For large numbers, use compact notation
  if (Math.abs(numAmount) >= 1000000) {
    return `${(numAmount / 1000000).toFixed(1)}M`;
  } else if (Math.abs(numAmount) >= 1000) {
    return `${(numAmount / 1000).toFixed(1)}K`;
  } else {
    return numAmount.toString();
  }
};