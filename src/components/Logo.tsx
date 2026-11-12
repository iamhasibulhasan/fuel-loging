import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { colors } from '../lib/theme';
import { Icon } from './ui';

/**
 * Animated "FB" (Fuel Burn) logo.
 * Sequence: badge springs in → F and B slide together → a fuel drop falls
 * between them with a bounce → a soft glow keeps pulsing behind the badge.
 */
export function Logo({ size = 96, animated = true, showName = false }: { size?: number; animated?: boolean; showName?: boolean }) {
  const [badge] = useState(() => new Animated.Value(animated ? 0 : 1));
  const [letters] = useState(() => new Animated.Value(animated ? 0 : 1));
  const [drop] = useState(() => new Animated.Value(animated ? 0 : 1));
  const [glow] = useState(() => new Animated.Value(0));
  const [name] = useState(() => new Animated.Value(animated ? 0 : 1));

  useEffect(() => {
    if (!animated) return;
    const intro = Animated.sequence([
      Animated.spring(badge, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }),
      Animated.timing(letters, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(drop, { toValue: 1, duration: 650, easing: Easing.bounce, useNativeDriver: true }),
      Animated.timing(name, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]);
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(400),
      ]),
    );
    intro.start(() => pulse.start());
    return () => {
      intro.stop();
      pulse.stop();
    };
  }, [animated, badge, letters, drop, glow, name]);

  const r = size * 0.28;
  const fontSize = size * 0.42;

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        {/* expanding glow ring */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: r,
            backgroundColor: colors.primary,
            opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }),
            transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] }) }],
          }}
        />
        {/* badge */}
        <Animated.View
          style={{
            transform: [
              { scale: badge },
              { rotate: badge.interpolate({ inputRange: [0, 1], outputRange: ['-25deg', '0deg'] }) },
            ],
            opacity: badge.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
          }}
        >
          <LinearGradient
            colors={['#14B8A6', '#0F766E', '#0B3B4A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: size, height: size, borderRadius: r, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
          >
            {/* glossy highlight */}
            <View
              style={{
                position: 'absolute',
                top: -size * 0.35,
                left: -size * 0.2,
                width: size * 1.1,
                height: size * 0.7,
                borderRadius: size,
                backgroundColor: 'rgba(255,255,255,0.12)',
              }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
              <Animated.Text
                style={{
                  color: '#fff',
                  fontSize,
                  fontWeight: '900',
                  letterSpacing: -1,
                  opacity: letters,
                  transform: [{ translateX: letters.interpolate({ inputRange: [0, 1], outputRange: [-size * 0.3, 0] }) }],
                }}
              >
                F
              </Animated.Text>
              {/* drop sits between F and B */}
              <Animated.View
                style={{
                  width: size * 0.24,
                  alignItems: 'center',
                  marginBottom: size * 0.1,
                  opacity: drop.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 1, 1] }),
                  transform: [{ translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [-size * 0.55, 0] }) }],
                }}
              >
                <Icon name="water" size={size * 0.3} color="#99F6E4" />
              </Animated.View>
              <Animated.Text
                style={{
                  color: '#fff',
                  fontSize,
                  fontWeight: '900',
                  letterSpacing: -1,
                  opacity: letters,
                  transform: [{ translateX: letters.interpolate({ inputRange: [0, 1], outputRange: [size * 0.3, 0] }) }],
                }}
              >
                B
              </Animated.Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
      {showName ? (
        <Animated.View
          style={{
            alignItems: 'center',
            marginTop: size * 0.16,
            opacity: name,
            transform: [{ translateY: name.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
          }}
        >
          <Text style={{ fontSize: Math.max(20, size * 0.26), fontWeight: '900', color: colors.text, letterSpacing: 0.5 }}>
            Fuel <Text style={{ color: colors.primary }}>Burn</Text>
          </Text>
          <Text style={{ fontSize: 11, color: colors.sub, letterSpacing: 2, marginTop: 2 }}>FUEL · SERVICE · OIL</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}
