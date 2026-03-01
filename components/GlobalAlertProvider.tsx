import React, { useState, useEffect } from 'react';
import CustomAlert from './CustomAlert';
import { setGlobalAlertManager, AlertOptions } from '@/utils/alerts';

interface GlobalAlertProviderProps {
  children: React.ReactNode;
}

export default function GlobalAlertProvider({ children }: GlobalAlertProviderProps) {
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning';
    buttons?: { text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }[];
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'error'
  });

  useEffect(() => {
    // Register the global alert manager for ALL platforms (mobile and web)
    setGlobalAlertManager({
      showAlert: (options: AlertOptions) => {
        setAlertState({
          visible: true,
          title: options.title,
          message: options.message,
          type: options.type || 'error',
          buttons: options.buttons
        });
      }
    });
  }, []);

  const hideAlert = () => {
    setAlertState(prev => ({ ...prev, visible: false }));
  };

  return (
    <>
      {children}
      {/* CustomAlert now renders on ALL platforms */}
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onClose={hideAlert}
        buttons={alertState.buttons}
      />
    </>
  );
}