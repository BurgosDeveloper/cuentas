import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  return (
    <View style={[styles.container, { borderColor: color, backgroundColor: `${color}14` }]}>
      <View style={styles.headerRow}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}28` }]}>
          <Ionicons name={(icon as any) || 'happy-outline'} size={20} color={color} />
        </View>
        <Text style={styles.emojiText}>{emoji}</Text>
        <Text style={[styles.labelText, { color }]}>{label}</Text>
      </View>
      {message && <Text style={styles.messageText}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1.2,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginVertical: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  emojiText: {
    fontSize: 18,
    marginRight: 8,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  messageText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
    lineHeight: 16,
  },
});
