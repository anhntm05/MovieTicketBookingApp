import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';
import { theme } from '../constants/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  isLoading = false,
  style,
  disabled,
  ...rest
}) => {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';
  const isDanger = variant === 'danger';

  let backgroundColor = theme.colors.primary;
  let textColor = theme.colors.white;
  let borderColor = 'transparent';

  if (isSecondary) {
    backgroundColor = theme.colors.surfaceLight;
  } else if (isOutline) {
    backgroundColor = 'transparent';
    borderColor = theme.colors.primary;
    textColor = theme.colors.primary;
  } else if (isDanger) {
    backgroundColor = theme.colors.error;
  }

  if (disabled) {
    backgroundColor = theme.colors.border;
    textColor = theme.colors.textSecondary;
    borderColor = 'transparent';
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor, borderColor, borderWidth: isOutline ? 1 : 0 },
        style,
      ]}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
  text: {
    fontSize: theme.typography.sizes.md,
    fontWeight: '600',
  },
});
