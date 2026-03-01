import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import Colors from '../constants/Colors';

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
  maxWidth?: number;
}

export function Sidebar({ visible, onClose, title, children, width = 350, maxWidth = 350 }: SidebarProps) {
  const screenWidth = Dimensions.get('window').width;
  const isMobile = screenWidth <= 768;

  if (!visible) return null;

  return (
    <>
      {/* Backdrop (mobile only) */}
      {isMobile && (
        <TouchableOpacity 
          style={styles.backdrop}
          onPress={onClose}
          activeOpacity={1}
        />
      )}
      
      {/* Sidebar Panel */}
      <View 
        style={[
          styles.container,
          isMobile ? styles.containerMobile : styles.containerDesktop,
          isMobile ? { width: '85%', maxWidth } : { width }
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity 
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.content}>
          {children}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 999,
  },
  container: {
    position: 'absolute',
    backgroundColor: Colors.background.card,
    boxShadow: '-4px 0px 12px 0px rgba(0, 0, 0, 0.3)',
    elevation: 16,
    zIndex: 1000,
  },
  containerDesktop: {
    top: 20,
    right: 20,
    bottom: 20,
  },
  containerMobile: {
    top: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    backgroundColor: Colors.primary[600],
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background.card,
  },
});