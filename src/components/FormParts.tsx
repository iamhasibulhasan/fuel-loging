import { router } from 'expo-router';
import { Alert, View } from 'react-native';
import { useStore } from '../lib/store';
import { colors } from '../lib/theme';
import { categoryInfo } from '../lib/units';
import { Button, Card, Chips, Empty, Label } from './ui';

export function VehiclePicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { data } = useStore();
  if (data.vehicles.length < 2) return null;
  return (
    <View style={{ marginBottom: 14 }}>
      <Label>Vehicle</Label>
      <Chips
        wrap={false}
        options={data.vehicles.map((v) => ({ key: v.id, label: v.name, icon: categoryInfo(v.category).icon }))}
        value={value}
        onChange={onChange}
      />
    </View>
  );
}

export function NoVehicle() {
  return (
    <Card style={{ margin: 16 }}>
      <Empty
        icon="car-off"
        title="No vehicle yet"
        text="Add a vehicle first, then you can log entries for it."
        action={<Button title="Add vehicle" icon="plus" onPress={() => router.replace('/vehicle')} />}
      />
    </Card>
  );
}

export function FormActions({ onSave, onDelete, color = colors.primary }: { onSave: () => void; onDelete?: () => void; color?: string }) {
  return (
    <View style={{ gap: 10, marginTop: 8 }}>
      <Button title="Save" icon="check" onPress={onSave} color={color} />
      {onDelete ? (
        <Button
          title="Delete"
          icon="delete-outline"
          variant="danger"
          onPress={() =>
            Alert.alert('Delete entry?', 'This cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: onDelete },
            ])
          }
        />
      ) : null}
    </View>
  );
}

/** Ask the user to confirm when an odometer reading looks lower than an earlier one. */
export function confirmOdometer(odometer: number, previous: number | null, unit: string, proceed: () => void) {
  if (previous != null && odometer < previous) {
    Alert.alert(
      'Odometer looks low',
      `An earlier entry has ${previous} ${unit}, but you entered ${odometer} ${unit}. Save anyway?`,
      [
        { text: 'Fix it', style: 'cancel' },
        { text: 'Save anyway', onPress: proceed },
      ],
    );
  } else {
    proceed();
  }
}

export const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
