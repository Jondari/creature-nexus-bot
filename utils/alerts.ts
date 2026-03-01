export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertOptions {
  title: string;
  message: string;
  buttons?: AlertButton[];
  type?: 'success' | 'error' | 'warning';
}

// Global CustomAlert manager for all platforms
let globalAlertManager: {
  showAlert: (options: AlertOptions) => void;
} | null = null;

export const setGlobalAlertManager = (manager: { showAlert: (options: AlertOptions) => void }) => {
  globalAlertManager = manager;
};

export const showAlert = (title: string, message: string, buttons?: AlertButton[], type: 'success' | 'error' | 'warning' = 'error') => {
  // Use CustomAlert for ALL platforms (mobile and web)
  if (globalAlertManager) {
    globalAlertManager.showAlert({ title, message, buttons, type });
  } else {
    // Fallback warning if manager not set
    if (__DEV__) {
      console.warn('GlobalAlertManager not initialized. Alert not shown:', title, message);
    }
  }
};

// Convenience methods for common alert types
export const showSuccessAlert = (title: string, message: string, onPress?: () => void) => {
  showAlert(title, message, [{ text: 'OK', onPress }], 'success');
};

export const showErrorAlert = (title: string, message: string, onPress?: () => void) => {
  showAlert(title, message, [{ text: 'OK', onPress }], 'error');
};

export const showWarningAlert = (title: string, message: string, onPress?: () => void) => {
  showAlert(title, message, [{ text: 'OK', onPress }], 'warning');
};

export const showConfirmAlert = (
  title: string, 
  message: string, 
  onConfirm: () => void, 
  onCancel?: () => void,
  confirmText: string = 'OK',
  cancelText: string = 'Cancel'
) => {
  showAlert(title, message, [
    { text: cancelText, style: 'cancel', onPress: onCancel },
    { text: confirmText, style: 'destructive', onPress: onConfirm }
  ], 'warning');
};