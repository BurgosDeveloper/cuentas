import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';

interface Split {
  id: string;
  amount: number;
  thirdParty?: { name: string };
  note?: string;
}

interface TransactionItemProps {
  transaction: {
    id: string;
    title: string;
    type: 'INCOME' | 'EXPENSE';
    amountOriginal: number;
    currency: 'USD' | 'VES' | 'COP';
    exchangeRate: number;
    amountUSD: number;
    isSettled: boolean;
    date: string;
    account?: { name: string; color?: string };
    thirdParty?: { name: string };
    project?: { name: string };
    splits?: Split[];
  };
  onToggleSettled: (id: string, currentSettled: boolean) => void;
  onPress?: () => void;
  onDelete?: (id: string) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onToggleSettled,
  onPress,
  onDelete,
}) => {
  const isIncome = transaction.type === 'INCOME';
  const isSettled = transaction.isSettled;

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleSettled(transaction.id, !isSettled);
  };

  // Generar texto resumen de splits si existen (ej. "-> arow 25 - basilico 5")
  const splitSummary =
    transaction.splits && transaction.splits.length > 0
      ? '-> ' +
        transaction.splits
          .map((s) => `${s.thirdParty?.name || 'Tercero'} $${s.amount}`)
          .join(' - ')
      : null;

  return (
    <View
      style={[
        styles.card,
        isSettled && styles.cardSettled,
        { borderLeftColor: isIncome ? Colors.success : Colors.danger },
      ]}
    >
      <TouchableOpacity
        style={styles.checkboxTouch}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.checkbox,
            isSettled ? styles.checkboxChecked : styles.checkboxUnchecked,
          ]}
        >
          {isSettled && (
            <Ionicons name="checkmark" size={16} color={Colors.bgDark} />
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.contentTouch}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.topRow}>
          <Text
            style={[
              styles.title,
              isSettled && styles.titleSettled,
            ]}
            numberOfLines={1}
          >
            {transaction.title}
          </Text>

          <Text
            style={[
              styles.amountText,
              { color: isIncome ? Colors.success : Colors.danger },
              isSettled && styles.amountSettled,
            ]}
          >
            {isIncome ? '+' : '-'}${transaction.amountOriginal.toFixed(2)}
            {transaction.currency !== 'USD' && (
              <Text style={styles.currencyCode}> {transaction.currency}</Text>
            )}
          </Text>
        </View>

        {/* Desglose de Splits o Tercero directo */}
        {splitSummary ? (
          <Text style={styles.splitText} numberOfLines={1}>
            {splitSummary}
          </Text>
        ) : transaction.thirdParty ? (
          <Text style={styles.splitText} numberOfLines={1}>
            {`-> ${transaction.thirdParty.name}`}
          </Text>
        ) : null}

        {/* Badges de cuenta y proyecto */}
        <View style={styles.bottomRow}>
          <View style={styles.tagsContainer}>
            {transaction.account && (
              <View style={styles.tagBadge}>
                <Ionicons name="wallet-outline" size={10} color={Colors.textSecondary} />
                <Text style={styles.tagText}>{transaction.account.name}</Text>
              </View>
            )}
            {transaction.project && (
              <View style={[styles.tagBadge, styles.projectBadge]}>
                <Ionicons name="briefcase-outline" size={10} color={Colors.accentGold} />
                <Text style={[styles.tagText, { color: Colors.accentGold }]}>
                  {transaction.project.name}
                </Text>
              </View>
            )}
          </View>

          {transaction.currency !== 'USD' && (
            <Text style={styles.equivUsd}>
              ≈ ${transaction.amountUSD.toFixed(2)} USD
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {onDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(transaction.id)}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(27, 61, 129, 0.12)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    borderLeftWidth: 4,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginVertical: 5,
  },
  cardSettled: {
    opacity: 0.6,
    backgroundColor: 'rgba(7, 10, 18, 0.4)',
  },
  checkboxTouch: {
    padding: 6,
    marginRight: 6,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxUnchecked: {
    borderWidth: 1.8,
    borderColor: Colors.textSecondary,
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: Colors.accentGold,
    borderColor: Colors.accentGold,
  },
  contentTouch: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  titleSettled: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  amountSettled: {
    opacity: 0.7,
  },
  currencyCode: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  splitText: {
    fontSize: 12,
    color: Colors.accentGold,
    marginTop: 2,
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  projectBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  tagText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  equivUsd: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  deleteButton: {
    padding: 6,
    marginLeft: 4,
  },
});
