// components/NotificationToast.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { NotificationData } from '@/services/websocketService';

interface ToastNotificationProps {
  notification: NotificationData;
  onDismiss: () => void;
  onPress?: () => void;
  duration?: number;
}

const { width: screenWidth } = Dimensions.get('window');

const ToastNotification: React.FC<ToastNotificationProps> = ({
  notification,
  onDismiss,
  onPress,
  duration = 4000,
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(-100));
  const [translateX] = useState(new Animated.Value(0));

  useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after duration
    const timer = setTimeout(() => {
      dismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const handleSwipe = (event: any) => {
    const { translationX, state } = event.nativeEvent;
    
    if (state === State.ACTIVE) {
      translateX.setValue(translationX);
    } else if (state === State.END) {
      if (Math.abs(translationX) > screenWidth * 0.3) {
        // Swipe far enough to dismiss
        Animated.timing(translateX, {
          toValue: translationX > 0 ? screenWidth : -screenWidth,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          onDismiss();
        });
      } else {
        // Snap back
        Animated.spring(translateX, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const getNotificationColor = () => {
    switch (notification.type) {
      case 'budget_warning': return '#FF9500';
      case 'budget_exceeded': return '#FF3B30';
      case 'expense_created': return '#34C759';
      case 'expense_updated': return '#007AFF';
      default: return '#8E8E93';
    }
  };

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'budget_warning': return '⚠️';
      case 'budget_exceeded': return '🚨';
      case 'expense_created': return '💸';
      case 'expense_updated': return '✏️';
      default: return '📢';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateY },
            { translateX },
          ],
        },
      ]}
    >
      <PanGestureHandler onGestureEvent={handleSwipe}>
        <Animated.View>
          <TouchableOpacity
            style={[
              styles.toast,
              { borderLeftColor: getNotificationColor() }
            ]}
            onPress={onPress}
            activeOpacity={0.9}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{getNotificationIcon()}</Text>
            </View>
            <View style={styles.content}>
              <Text style={styles.title} numberOfLines={1}>
                {notification.title}
              </Text>
              <Text style={styles.message} numberOfLines={2}>
                {notification.message}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={dismiss}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // Adjust based on your app's status bar
    left: 15,
    right: 15,
    zIndex: 1000,
  },
  toast: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: '#48484A',
    lineHeight: 18,
  },
  closeButton: {
    padding: 5,
    marginLeft: 10,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#8E8E93',
    fontWeight: 'bold',
  },
});

export default ToastNotification;