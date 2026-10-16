import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';

interface PinPadProps {
  onPinComplete: (pin: string) => void;
  onBiometricPress?: () => void;
  hasBiometrics?: boolean;
  pinLength?: number;
}

export const PinPad: React.FC<PinPadProps> = ({
  onPinComplete,
  onBiometricPress,
  hasBiometrics = true,
  pinLength = 6,
}) => {
  const [pin, setPin] = useState('');

  const handleKeyPress = (num: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (pin.length < pinLength) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === pinLength) {
        onPinComplete(nextPin);
      }
    }
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  const handleBiometrics = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onBiometricPress) {
      onBiometricPress();
    }
  };

  const renderDots = () => {
    const dots = [];
    for (let i = 0; i < pinLength; i++) {
      const isFilled = i < pin.length;
      dots.push(
        <View
          key={i}
          style={[
            styles.dot,
            isFilled ? styles.dotFilled : styles.dotEmpty,
          ]}
        />
      );
    }
    return <View style={styles.dotsRow}>{dots}</View>;
  };

  const renderKey = (num: string) => (
    <TouchableOpacity
      key={num}
      style={styles.keyButton}
      onPress={() => handleKeyPress(num)}
      activeOpacity={0.6}
    >
      <Text style={styles.keyText}>{num}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {renderDots()}

      <View style={styles.grid}>
        <View style={styles.row}>
          {renderKey('1')}
          {renderKey('2')}
          {renderKey('3')}
        </View>
        <View style={styles.row}>
          {renderKey('4')}
          {renderKey('5')}
          {renderKey('6')}
        </View>
        <View style={styles.row}>
          {renderKey('7')}
          {renderKey('8')}
          {renderKey('9')}
        </View>
        <View style={styles.row}>
          {hasBiometrics ? (
            <TouchableOpacity
              style={styles.keyButtonAction}
              onPress={handleBiometrics}
              activeOpacity={0.6}
            >
              <Ionicons name="finger-print" size={28} color={Colors.accentGold} />
            </TouchableOpacity>
          ) : (
            <View style={styles.keyButtonAction} />
          )}

          {renderKey('0')}

          <TouchableOpacity
            style={styles.keyButtonAction}
            onPress={handleDelete}
            activeOpacity={0.6}
          >
            <Ionicons name="backspace-outline" size={26} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 14,
    marginVertical: 24,
    alignItems: 'center',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  dotEmpty: {
    borderWidth: 1.5,
    borderColor: Colors.borderGlass,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: Colors.accentGold,
    shadowColor: Colors.accentGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  grid: {
    width: '80%',
    maxWidth: 320,
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  keyButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(27, 61, 129, 0.25)',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    fontSize: 26,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  keyButtonAction: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
