import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { close, confirmOdometer, FormActions, NoVehicle, VehiclePicker } from '../components/FormParts';
import { Card, Chips, Col, DateField, Field, Label, Row, Screen } from '../components/ui';
import { fmtMoney, fmtNum, numToInput, parseNum, todayISO, uid } from '../lib/format';
import { readingBefore } from '../lib/stats';
import { useStore } from '../lib/store';
import { colors } from '../lib/theme';
import type { FuelLog, FuelType, VolumeUnit } from '../lib/types';
import { FUEL_TYPES, VOLUME_LABEL } from '../lib/units';

const round2 = (n: number) => Math.round(n * 100) / 100;

export default function FuelForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data, settings, activeVehicle, saveLog, deleteLog } = useStore();
  const existing = id ? data.fuel.find((f) => f.id === id) : undefined;

  const [vehicleId, setVehicleId] = useState(existing?.vehicleId ?? activeVehicle?.id ?? '');
  const vehicle = data.vehicles.find((v) => v.id === vehicleId);

  // pre-fill unit price from the last fill-up of this vehicle
  const lastFill = useMemo(
    () => data.fuel.filter((f) => f.vehicleId === vehicleId).sort((a, b) => b.date.localeCompare(a.date))[0],
    [data.fuel, vehicleId],
  );

  const [date, setDate] = useState(existing?.date ?? todayISO());
  const [odometer, setOdometer] = useState(numToInput(existing?.odometer));
  const [volumeUnit, setVolumeUnit] = useState<VolumeUnit>(existing?.volumeUnit ?? settings.volumeUnit);
  const [volume, setVolume] = useState(numToInput(existing?.volume));
  const [price, setPrice] = useState(numToInput(existing?.unitPrice ?? lastFill?.unitPrice));
  const [total, setTotal] = useState(numToInput(existing?.total));
  const [fullTank, setFullTank] = useState(existing?.fullTank ?? true);
  const [fuelType, setFuelType] = useState<FuelType>(existing?.fuelType ?? vehicle?.fuelType ?? 'octane');
  const [station, setStation] = useState(existing?.station ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!vehicle) return <NoVehicle />;
  const unit = vehicle.odometerUnit;
  const prev = readingBefore(data, vehicle.id, date, existing?.id);

  const onVolume = (t: string) => {
    setVolume(t);
    const v = parseNum(t);
    const p = parseNum(price);
    if (isFinite(v) && isFinite(p)) setTotal(String(round2(v * p)));
  };
  const onPrice = (t: string) => {
    setPrice(t);
    const v = parseNum(volume);
    const p = parseNum(t);
    if (isFinite(v) && isFinite(p)) setTotal(String(round2(v * p)));
  };
  const onTotal = (t: string) => {
    setTotal(t);
    const tt = parseNum(t);
    const p = parseNum(price);
    if (isFinite(tt) && isFinite(p) && p > 0) setVolume(String(round2(tt / p)));
  };

  const save = () => {
    const e: Record<string, string> = {};
    const odo = parseNum(odometer);
    const vol = parseNum(volume);
    const pr = parseNum(price);
    let tot = parseNum(total);
    if (!isFinite(odo) || odo < 0) e.odometer = 'Enter the current odometer reading';
    if (!isFinite(vol) || vol <= 0) e.volume = 'Enter fuel volume';
    if (!isFinite(pr) || pr < 0) e.price = 'Enter price per unit';
    if (!isFinite(tot)) tot = isFinite(vol) && isFinite(pr) ? round2(vol * pr) : NaN;
    if (!isFinite(tot) || tot < 0) e.total = 'Enter total amount';
    setErrors(e);
    if (Object.keys(e).length) return;

    const log: FuelLog = {
      id: existing?.id ?? uid(),
      vehicleId: vehicle.id,
      date,
      odometer: odo,
      volume: vol,
      volumeUnit,
      unitPrice: pr,
      total: tot,
      fullTank,
      fuelType,
      station: station.trim(),
      notes: notes.trim(),
    };
    confirmOdometer(odo, prev, unit, () => {
      saveLog('fuel', log);
      close();
    });
  };

  const vLabel = VOLUME_LABEL[volumeUnit];

  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? 'Edit Fuel Entry' : 'Add Fuel' }} />
      <VehiclePicker value={vehicleId} onChange={setVehicleId} />

      <Card>
        <Label>Fill type</Label>
        <View style={{ marginBottom: 10 }}>
          <Chips
            color={colors.fuel}
            options={[
              { key: 'full', label: 'Full tank', icon: 'gas-station' },
              { key: 'partial', label: 'Partial', icon: 'gas-station-outline' },
            ]}
            value={fullTank ? 'full' : 'partial'}
            onChange={(k) => setFullTank(k === 'full')}
          />
          <Text style={{ color: colors.faint, fontSize: 12, marginTop: 6 }}>
            Mileage is calculated accurately between two full-tank fill-ups.
          </Text>
        </View>

        <DateField label="Date" value={date} onChange={setDate} />
        <Field
          label="Current odometer"
          numeric
          value={odometer}
          onChangeText={setOdometer}
          suffix={unit}
          placeholder={prev != null ? String(prev) : '0'}
          hint={prev != null ? `Previous reading: ${fmtNum(prev)} ${unit}` : undefined}
          error={errors.odometer}
        />
      </Card>

      <Card>
        <Label>Volume unit</Label>
        <View style={{ marginBottom: 10 }}>
          <Chips
            color={colors.fuel}
            options={(['L', 'galUS', 'galUK'] as VolumeUnit[]).map((u) => ({ key: u, label: VOLUME_LABEL[u] }))}
            value={volumeUnit}
            onChange={setVolumeUnit}
          />
        </View>
        <Row>
          <Col>
            <Field label="Fuel volume" numeric value={volume} onChangeText={onVolume} suffix={vLabel} placeholder="0" error={errors.volume} />
          </Col>
          <Col>
            <Field
              label="Unit price"
              numeric
              value={price}
              onChangeText={onPrice}
              suffix={`${settings.currencySymbol}/${vLabel}`}
              placeholder="0"
              error={errors.price}
            />
          </Col>
        </Row>
        <Field
          label="Total amount (auto calculated)"
          numeric
          value={total}
          onChangeText={onTotal}
          suffix={settings.currencyCode}
          placeholder="0"
          error={errors.total}
          style={{ fontSize: 22, fontWeight: '800' }}
          hint={isFinite(parseNum(total)) ? fmtMoney(settings, parseNum(total)) : 'Volume × unit price. Edit total to back-calculate volume.'}
        />
      </Card>

      <Card>
        <Label>Fuel type</Label>
        <View style={{ marginBottom: 10 }}>
          <Chips color={colors.fuel} options={FUEL_TYPES} value={fuelType} onChange={setFuelType} />
        </View>
        <Field label="Fuel station (optional)" value={station} onChangeText={setStation} placeholder="e.g. Padma Oil, Meghna Filling Station" />
        <Field label="Notes (optional)" value={notes} onChangeText={setNotes} multiline placeholder="Anything to remember" />
      </Card>

      <FormActions
        color={colors.fuel}
        onSave={save}
        onDelete={
          existing
            ? () => {
                deleteLog('fuel', existing.id);
                close();
              }
            : undefined
        }
      />
    </Screen>
  );
}
