import { memo, useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../utils/badges';
import { Theme } from '../constants/colors';

interface BadgeDialogProps {
  badge: Badge | null;
  onClose: () => void;
  C: Theme;
}

const BadgeDialog = memo(({ badge, onClose, C }: BadgeDialogProps) => {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  // Keep last badge in ref so dialog content doesn't blank out during close animation
  const lastBadge = useRef<Badge | null>(null);
  if (badge) lastBadge.current = badge;
  const displayBadge = badge ?? lastBadge.current;

  useEffect(() => {
    if (badge) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 18,
          stiffness: 260,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [badge]);

  if (!displayBadge) return null;
  const isUnlocked = displayBadge.unlocked;

  return (
    <Modal
      visible={!!badge}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View style={[
              styles.dialog,
              {
                backgroundColor: isUnlocked ? C.surface : C.background,
                borderColor: isUnlocked ? displayBadge.iconColor + '40' : C.border,
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              },
            ]}>

              {/* Icon container */}
              <View style={[
                styles.iconContainer,
                {
                  backgroundColor: isUnlocked
                    ? displayBadge.iconColor + '18'
                    : C.border + '60',
                },
              ]}>
                {/* Glow ring for unlocked */}
                {isUnlocked && (
                  <View style={[styles.iconGlow, { backgroundColor: displayBadge.iconColor + '12' }]} />
                )}
                <Ionicons
                  name={displayBadge.icon as any}
                  size={44}
                  color={isUnlocked ? displayBadge.iconColor : C.textMuted}
                  style={{ opacity: isUnlocked ? 1 : 0.35 }}
                />
              </View>

              {/* Status pill */}
              <View style={[
                styles.statusPill,
                {
                  backgroundColor: isUnlocked
                    ? displayBadge.iconColor + '18'
                    : C.border,
                },
              ]}>
                <Ionicons
                  name={isUnlocked ? 'lock-open' : 'lock-closed'}
                  size={11}
                  color={isUnlocked ? displayBadge.iconColor : C.textMuted}
                  style={{ marginRight: 4 }}
                />
                <Text style={[
                  styles.statusText,
                  { color: isUnlocked ? displayBadge.iconColor : C.textMuted },
                ]}>
                  {isUnlocked ? 'Unlocked' : 'Locked'}
                </Text>
              </View>

              {/* Title */}
              <Text style={[
                styles.title,
                { color: isUnlocked ? C.textPrimary : C.textMuted },
              ]}>
                {displayBadge.title}
              </Text>

              {/* Description / Hint */}
              <Text style={[
                styles.description,
                { color: isUnlocked ? C.textSecondary : C.textMuted },
              ]}>
                {isUnlocked ? displayBadge.description : displayBadge.hint}
              </Text>

              {/* Divider */}
              <View style={[styles.divider, { backgroundColor: C.border }]} />

              {/* Close button */}
              <TouchableOpacity
                style={[
                  styles.closeBtn,
                  {
                    backgroundColor: isUnlocked
                      ? displayBadge.iconColor
                      : C.primary,
                  },
                ]}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.closeBtnText}>
                  {isUnlocked ? 'Nice!' : 'Got it'}
                </Text>
              </TouchableOpacity>

            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
});

export default BadgeDialog;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  dialog: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconGlow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
  },
  divider: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    marginVertical: 18,
  },
  closeBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
