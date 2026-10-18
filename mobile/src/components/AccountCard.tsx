import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { ScalePressable } from './AnimatedWidgets';

interface AccountCardProps {
  name: string;
  currency: 'USD' | 'VES' | 'COP';
  balance: number;
  color?: string;
  icon?: string;
  onTransferPress?: () => void;
  onAdjustPress?: () => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  name,
  currency,
  balance,
  color = Colors.primary,
  icon = 'wallet-outline',
  onTransferPress,
  onAdjustPress,
}) => {
  const getCurrencySymbol = () => {
    switch (currency) {
      case 'USD':
        return '$';
      case 'VES':
        return 'Bs';
      case 'COP':
        return 'COP $';
    }
  };

  const handlePress = () => {
    Haptics.selectionAsync().catch(() => {});
    if (onAdjustPress) onAdjustPress();
    else if (onTransferPress) onTransferPress();
  };

  return (
    <ScalePressable
      style={styles.cardOuter}
      onPress={handlePress}
      scaleTo={0.96}
    >
      <LinearGradient
        colors={[`${color}26`, 'rgba(10, 15, 28, 0.85)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { borderColor: `${color}88` }]}
      >
        <View style={styles.topRow}>
          <View style={[styles.iconWrapper, { backgroundColor: `${color}28` }]}>
            <Ionicons name={(icon as any) || 'wallet-outline'} size={17} color={color} />
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {onTransferPress && (
            <TouchableOpacity
              style={styles.transferBtn}
              onPress={handlePress}
              activeOpacity={0.7}
            >
              <Ionicons name="options-outline" size={15} color={Colors.accentGold} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.balanceWrapper}>
          <Text style={styles.symbol}>{getCurrencySymbol()} </Text>
          <Text style={styles.balance} numberOfLines={1} adjustsFontSizeToFit>
            {balance.toLocaleString('es-ES', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>

        <View style={styles.footerRow}>
          <View style={[styles.currPill, { borderColor: `${color}55` }]}>
            <Text style={[styles.currPillText, { color }]}>{currency}</Text>
          </View>
          <Text style={styles.tapHint}>Ajustar</Text>
        </View>
      </LinearGradient>
    </ScalePressable>
  );
};

const styles = StyleSheet.create({
  cardOuter: {
    width: '48.2%',
    marginVertical: 5,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1.2,
    padding: 13,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    flex: 1,
  },
  transferBtn: {
    padding: 3,
  },
  balanceWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  symbol: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.accentGold,
  },
  balance: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  currPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  tapHint: {
    fontSize: 9.5,
    color: Colors.textMuted,
    fontWeight: '600',
  },
});
