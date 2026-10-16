import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

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

  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: color }]}
      onPress={onAdjustPress || onTransferPress}
      activeOpacity={0.85}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconWrapper, { backgroundColor: `${color}25` }]}>
          <Ionicons name={(icon as any) || 'wallet-outline'} size={18} color={color} />
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {onTransferPress && (
          <TouchableOpacity
            style={styles.transferBtn}
            onPress={onTransferPress}
            activeOpacity={0.7}
          >
            <Ionicons name="options-outline" size={16} color={Colors.accentGold} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.balanceWrapper}>
        <Text style={styles.symbol}>{getCurrencySymbol()} </Text>
        <Text style={styles.balance} numberOfLines={1} adjustsFontSizeToFit>
          {balance.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(27, 61, 129, 0.15)',
    borderRadius: 16,
    borderWidth: 1.2,
    padding: 14,
    marginVertical: 4,
    width: '48%',
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
    padding: 4,
  },
  balanceWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  symbol: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accentGold,
  },
  balance: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    flexShrink: 1,
  },
});
