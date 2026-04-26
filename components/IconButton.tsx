import { memo } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface IconButtonProps {
  name: IoniconsName;
  size?: number;
  color: string;
  onPress: () => void;
  style?: ViewStyle;
  hitSlop?: number;
}

function IconButton({ name, size = 18, color, onPress, style, hitSlop = 8 }: IconButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.btn, style]}
      hitSlop={{ top: hitSlop, bottom: hitSlop, left: hitSlop, right: hitSlop }}
      activeOpacity={0.6}
    >
      <Ionicons name={name} size={size} color={color} />
    </TouchableOpacity>
  );
}

export default memo(IconButton);

const styles = StyleSheet.create({
  btn: { padding: 6, justifyContent: 'center', alignItems: 'center' },
});
