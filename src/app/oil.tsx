import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { close, confirmOdometer, FormActions, NoVehicle, VehiclePicker } from '../components/FormParts';
import { Card, Chips, Col, DateField, Field, Row, Screen, SwitchRow } from '../components/ui';
import { fmtNum, numToInput, parseNum, todayISO, uid } from '../lib/format';
import { readingBefore } from '../lib/stats';
import { useStore } from '../lib/store';
import { colors } from '../lib/theme';
import type { OilLog } from '../lib/types';
import { OIL_INTERVALS } from '../lib/units';

export default function OilForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data, settings, activeVehicle, saveLog, deleteLog } = useStore();
  const existing = id ? data.oils.find((o) => o.id === id) : undefined;

  const [vehicleId, setVehicleId] = useState(existing?.vehicleId ?? activeVehicle?.id ?? '');
  const vehicle = data.vehicles.find((v) => v.id === vehicleId);

  // remember the last oil used for this vehicle to speed up entry
  const lastOil = useMemo(
    () => data.oils.filter((o) => o.vehicleId === vehicleId).sort((a, b) => b.date.localeCompare(a.date))[0],
    [data.oils, vehicleId],
  );

  const [date, setDate] = useState(existing?.date ?? todayISO());
  const [odometer, setOdometer] = useState(numToInput(existing?.odometer));
  const [oilName, setOilName] = useState(existing?.oilName ?? lastOil?.oilName ?? 'Engine Oil');
  const [grade, setGrade] = useState(existing?.grade ?? lastOil?.grade ?? '');
  const [quantity, setQuantity] = useState(numToInput(existing?.quantity ?? lastOil?.quantity));
  const [intervalText, setIntervalText] = useState(numToInput(existing?.intervalKm ?? lastOil?.intervalKm ?? 2000));
  const [price, setPrice] = useState(numToInput(existing?.price));
  const [filterChanged, setFilterChanged] = useState(existing?.filterChanged ?? false);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!vehicle) return <NoVehicle />;
  const unit = vehicle.odometerUnit;
  const prev = readingBefore(data, vehicle.id, date, existing?.id);
  const odoN = parseNum(odometer);
  const intN = parseNum(intervalText);
  const nextAt = isFinite(odoN) && isFinite(intN) ? odoN + intN : null;

  const save = () => {
    const e: Record<string, string> = {};
    const pr = parseNum(price);
    const q = parseNum(quantity);
    if (!isFinite(odoN) || odoN < 0) e.odometer = 'Enter the current odometer reading';
    if (!isFinite(intN) || intN <= 0) e.interval = `How many ${unit} will this oil be used?`;
    if (price.trim() !== '' && (!isFinite(pr) || pr < 0)) e.price = 'Invalid price';
    setErrors(e);
    if (Object.keys(e).length) return;
    const log: OilLog = {
      id: existing?.id ?? uid(),
      vehicleId: vehicle.id,
      date,
      odometer: odoN,
      oilName: oilName.trim() || 'Engine Oil',
      grade: grade.trim(),
      quantity: isFinite(q) ? q : null,
      intervalKm: intN,
      price: isFinite(pr) ? pr : 0,
      filterChanged,
      notes: notes.trim(),
    };
    confirmOdometer(odoN, prev, unit, () => {
      saveLog('oils', log);
      close();
    });
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? 'Edit Oil Change' : 'Engine Oil Change' }} />
      <VehiclePicker value={vehicleId} onChange={setVehicleId} />

      <Card>
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
        <Field label="Engine oil name" value={oilName} onChangeText={setOilName} placeholder="Engine Oil" />
        <Row>
          <Col>
            <Field label="Grade (optional)" value={grade} onChangeText={setGrade} placeholder="10W-30" autoCapitalize="characters" />
          </Col>
          <Col>
            <Field label="Quantity (optional)" numeric value={quantity} onChangeText={setQuantity} suffix="L" placeholder="1.0" />
          </Col>
        </Row>
        <Field
          label={`Use this oil for (${unit})`}
          numeric
          value={intervalText}
          onChangeText={setIntervalText}
          suffix={unit}
          error={errors.interval}
        />
        <View style={{ marginTop: -4, marginBottom: 10 }}>
          <Chips
            wrap={false}
            color={colors.oil}
            options={OIL_INTERVALS.map((n) => ({ key: n, label: fmtNum(n) }))}
            value={intN}
            onChange={(n) => setIntervalText(String(n))}
          />
        </View>
        {nextAt != null ? (
          <View style={{ backgroundColor: colors.oilSoft, borderRadius: 12, padding: 12, marginBottom: 10 }}>
            <Text style={{ color: colors.oil, fontWeight: '700' }}>
              Next oil change at {fmtNum(nextAt)} {unit}
            </Text>
          </View>
        ) : null}
        <Field
          label="Price"
          numeric
          value={price}
          onChangeText={setPrice}
          suffix={settings.currencyCode}
          placeholder="0"
          error={errors.price}
        />
        <SwitchRow label="Oil filter also changed" value={filterChanged} onChange={setFilterChanged} />
        <Field label="Notes (optional)" value={notes} onChangeText={setNotes} multiline placeholder="Shop, brand details…" />
      </Card>

      <FormActions
        color={colors.oil}
        onSave={save}
        onDelete={
          existing
            ? () => {
                deleteLog('oils', existing.id);
                close();
              }
            : undefined
        }
      />
    </Screen>
  );
}
