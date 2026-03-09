import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { colors } from '@/constants/theme';

export function HeaderCloudIcon() {
  const { isConnected } = useNetworkStatus();

  return (
    <View style={s.container}>
      {isConnected ? (
        <Text style={[s.icon, { color: colors.success }]}>&#9729;&#10003;</Text>
      ) : (
        <Text style={[s.icon, { color: colors.warning }]}>&#9729;&#10007;</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 18 },
});
