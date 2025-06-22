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

export const formatCurrency = (amount: number | string, currency: string = 'PHP'): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  const currencies: Record<string, { symbol: string; locale: string }> = {
    PHP: { symbol: '₱', locale: 'en-PH' },
    USD: { symbol: '$', locale: 'en-US' },
    EUR: { symbol: '€', locale: 'de-DE' },
    GBP: { symbol: '£', locale: 'en-GB' }
  };

  const currencyConfig = currencies[currency] || currencies.PHP;
  
  return new Intl.NumberFormat(currencyConfig.locale, {
    style: 'currency',
    currency: currency === 'PHP' ? 'USD' : currency, // PHP fallback to USD for Intl
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount).replace(/^\$/, currencyConfig.symbol);
};