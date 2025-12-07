import React, { useState, useEffect, useRef } from 'react';
import { TextInput, StyleSheet, TextInputProps, View, Text } from 'react-native';

interface PhoneInputProps extends Omit<TextInputProps, 'value' | 'onChangeText' | 'keyboardType'> {
  value: string;
  onChangeText: (normalizedPhone: string) => void;
  error?: boolean;
  errorText?: string;
}

/**
 * Нормализует номер телефона в формат 7XXXXXXXXXX для API
 * Поддерживает ввод с +7, 8, или просто цифр
 */
export function normalizePhoneNumber(input: string): string {
  let digits = input.replace(/\D/g, '');
  
  if (digits.length === 0) {
    return '';
  }
  
  if (digits.startsWith('8')) {
    digits = '7' + digits.slice(1);
  }
  
  if (!digits.startsWith('7') && !digits.startsWith('8')) {
    if (digits.length === 10) {
      digits = '7' + digits;
    } else if (digits.length < 10) {
      digits = '7' + digits;
    }
  }
  
  return digits.slice(0, 11);
}

/**
 * Форматирует номер телефона для отображения: +7 (XXX) XXX-XX-XX
 */
export function formatPhoneNumber(normalized: string): string {
  if (!normalized || normalized.length === 0) {
    return '';
  }
  
  if (!normalized.startsWith('7')) {
    return normalized;
  }
  
  const rest = normalized.slice(1);
  
  if (rest.length === 0) {
    return '+7';
  } else if (rest.length <= 3) {
    return `+7 (${rest}`;
  } else if (rest.length <= 6) {
    return `+7 (${rest.slice(0, 3)}) ${rest.slice(3)}`;
  } else if (rest.length <= 8) {
    return `+7 (${rest.slice(0, 3)}) ${rest.slice(3, 6)}-${rest.slice(6)}`;
  } else {
    return `+7 (${rest.slice(0, 3)}) ${rest.slice(3, 6)}-${rest.slice(6, 8)}-${rest.slice(8, 10)}`;
  }
}

export default function PhoneInput({
  value,
  onChangeText,
  error = false,
  errorText,
  style,
  ...props
}: PhoneInputProps) {
  const [displayValue, setDisplayValue] = useState(() => {
    if (value) {
      const normalized = normalizePhoneNumber(value);
      return formatPhoneNumber(normalized);
    }
    return '';
  });
  const normalizedValueRef = useRef(value || '');

  useEffect(() => {
    const normalized = normalizePhoneNumber(value || '');
    if (normalized !== normalizedValueRef.current) {
      normalizedValueRef.current = normalized;
      setDisplayValue(formatPhoneNumber(normalized));
    }
  }, [value]);

  const handleChangeText = (text: string) => {
    if (text.startsWith('+')) {
      text = text.slice(1);
    }
    
    const normalized = normalizePhoneNumber(text);
    normalizedValueRef.current = normalized;
    
    const formatted = formatPhoneNumber(normalized);
    setDisplayValue(formatted);
    
    onChangeText(normalized);
  };

  return (
    <View>
      <TextInput
        {...props}
        style={[
          styles.input,
          error && styles.inputError,
          style,
        ]}
        value={displayValue}
        onChangeText={handleChangeText}
        keyboardType="phone-pad"
        placeholder="+7 (XXX) XXX-XX-XX"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {error && errorText && (
        <Text style={styles.errorText}>{errorText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: '#ff4444',
    backgroundColor: '#fff5f5',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
});

