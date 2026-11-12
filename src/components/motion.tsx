import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

// Small animation toolkit on top of React Native's Animated API (native driver
// wherever the animated property allows it, so animations stay smooth).

/** Fades + slides children in when mounted. Use `delay` to stagger lists. */
export function FadeIn({
  children,
  delay = 0,
  distance = 16,
  duration = 420,
  style,
}: {
  children: ReactNode;
  delay?: number;
  distance?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const v = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [v, delay, duration]);
  return (
    <Animated.View
      style={[
        style,
        { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Pressable that springs down slightly while pressed. */
export function PressableScale({
  children,
  style,
  scaleTo = 0.95,
  ...rest
}: Omit<PressableProps, 'style' | 'children'> & { children: ReactNode; style?: StyleProp<ViewStyle>; scaleTo?: number }) {
  const scale = useState(() => new Animated.Value(1))[0];
  const to = (value: number) => Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 40, bounciness: 8 }).start();
  return (
    <Pressable {...rest} onPressIn={(e) => (to(scaleTo), rest.onPressIn?.(e))} onPressOut={(e) => (to(1), rest.onPressOut?.(e))}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

/** Animates a number from its previous value to `target`. */
export function useCountUp(target: number | null | undefined, duration = 900): number | null {
  const [value, setValue] = useState(0);
  const from = useRef(0);
  const valid = target != null && isFinite(target);
  useEffect(() => {
    if (target == null || !isFinite(target)) return;
    const start = from.current;
    const anim = new Animated.Value(0);
    const id = anim.addListener(({ value: t }) => setValue(start + (target - start) * t));
    Animated.timing(anim, { toValue: 1, duration, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(() => {
      from.current = target;
      setValue(target);
    });
    return () => {
      anim.stopAnimation();
      anim.removeListener(id);
      from.current = target;
    };
  }, [target, duration]);
  return valid ? value : null;
}

/** Endless gentle pulse (for warnings / attention). */
export function Pulse({ children, active = true }: { children: ReactNode; active?: boolean }) {
  const v = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, active]);
  return (
    <Animated.View
      style={{
        opacity: v.interpolate({ inputRange: [0, 1], outputRange: [1, 0.55] }),
        transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

/** Slow floating motion (empty-state illustrations). */
export function Float({ children, amount = 6 }: { children: ReactNode; amount?: number }) {
  const v = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  return (
    <Animated.View style={{ transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -amount] }) }] }}>
      {children}
    </Animated.View>
  );
}

/** 0..1 value that animates towards `to` (for progress bars, gauges). */
export function useAnimatedTo(to: number, { duration = 900, delay = 0 } = {}) {
  const v = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    Animated.timing(v, { toValue: to, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [v, to, duration, delay]);
  return v;
}
