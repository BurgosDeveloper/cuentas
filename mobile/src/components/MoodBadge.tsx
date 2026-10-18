import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';

interface MoodBadgeProps {
  status?: 'CRITICAL' | 'NEUTRAL' | 'GOOD' | 'PROSPEROUS';
  emoji?: string;
  icon?: string;
  color?: string;
  label?: string;
  message?: string;
}

export const MoodBadge: React.FC<MoodBadgeProps> = ({
  emoji = '🙂',
  icon = 'happy-outline',
  color = Colors.success,
  label = 'Flujo Positivo',
  message,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.09,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  return (
    <LinearGradient
      colors={[`${color}22`, 'rgba(13, 19, 34, 0.85)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { borderColor: `${color}66` }]}
    >
      <View style={styles.headerRow}>
        <Animated.View
          style={[
            styles.iconContainer,
            {
              backgroundColor: `${color}28`,
              borderColor: `${color}55`,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Ionicons name={(icon as any) || 'happy-outline'} size={19} color={color} />
        </Animated.View>
        <View style={{ flex: 1 }}>
          <View style={styles.titleLine}>
            <Text style={styles.emojiText}>{emoji}</Text>
            <Text style={[styles.labelText, { color }]}>{label}</Text>
          </View>
          {message && <Text style={styles.messageText}>{message}</Text>}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1.2,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginVertical: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 16,
    marginRight: 6,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  messageText: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    marginTop: 3,
    lineHeight: 15.5,
  },
});
