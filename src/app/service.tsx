import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { close, confirmOdometer, FormActions, NoVehicle, VehiclePicker } from '../components/FormParts';
import { Card, Chips, Col, DateField, Field, Icon, Label, Row, Screen, SwitchRow } from '../components/ui';
import { fmtMoney, fmtNum, numToInput, parseNum, todayISO, toISODate, uid } from '../lib/format';
import { readingBefore } from '../lib/stats';
import { useStore } from '../lib/store';
import { colors } from '../lib/theme';
import type { ServiceLog } from '../lib/types';
import { SERVICE_ITEMS } from '../lib/units';

export default function ServiceForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data, settings, activeVehicle, saveLog, deleteLog } = useStore();
  const existing = id ? data.services.find((s) => s.id === id) : undefined;

  const [vehicleId, setVehicleId] = useState(existing?.vehicleId ?? activeVehicle?.id ?? '');
  const vehicle = data.vehicles.find((v) => v.id === vehicleId);

  const [date, setDate] = useState(existing?.date ?? todayISO());
  const [odometer, setOdometer] = useState(numToInput(existing?.odometer));
  const [items, setItems] = useState<string[]>(existing?.items ?? []);
  const [custom, setCustom] = useState('');
  const [garage, setGarage] = useState(existing?.garage ?? '');
  const [parts, setParts] = useState(numToInput(existing?.partsCost));
  const [labor, setLabor] = useState(numToInput(existing?.laborCost));
  const [reminder, setReminder] = useState(!!(existing?.nextOdometer || existing?.nextDate));
  const [nextOdo, setNextOdo] = useState(numToInput(existing?.nextOdometer));
  const [nextDate, setNextDate] = useState(() => existing?.nextDate ?? toISODate(new Date(Date.now() + 90 * 86400000)));
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!vehicle) return <NoVehicle />;
  const unit = vehicle.odometerUnit;
  const prev = readingBefore(data, vehicle.id, date, existing?.id);

  // past custom items used on any vehicle become quick options too
  const allItems = [...new Set([...SERVICE_ITEMS, ...data.services.flatMap((s) => s.items), ...items])];

  const toggle = (k: string) => setItems((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));
  const addCustom = () => {
    const t = custom.trim();
    if (t && !items.includes(t)) setItems([...items, t]);
    setCustom('');
  };

  const p = parseNum(parts);
  const l = parseNum(labor);
  const total = (isFinite(p) ? p : 0) + (isFinite(l) ? l : 0);

  const save = () => {
    const e: Record<string, string> = {};
    const odo = parseNum(odometer);
    if (!isFinite(odo) || odo < 0) e.odometer = 'Enter the current odometer reading';
    if (!items.length && !custom.trim()) e.items = 'Select at least one service item';
    const no = parseNum(nextOdo);
    setErrors(e);
    if (Object.keys(e).length) return;
    const finalItems = custom.trim() && !items.includes(custom.trim()) ? [...items, custom.trim()] : items;
    const log: ServiceLog = {
      id: existing?.id ?? uid(),
      vehicleId: vehicle.id,
      date,
      odometer: odo,
      items: finalItems,
      garage: garage.trim(),
      partsCost: isFinite(p) ? p : 0,
      laborCost: isFinite(l) ? l : 0,
      total,
      nextOdometer: reminder && isFinite(no) ? no : null,
      nextDate: reminder ? nextDate : null,
      notes: notes.trim(),
    };
    confirmOdometer(odo, prev, unit, () => {
      saveLog('services', log);
      close();
    });
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? 'Edit Service' : 'Add Service' }} />
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
        <Field label="Garage / workshop (optional)" value={garage} onChangeText={setGarage} placeholder="e.g. Walton Service Center" />
      </Card>

      <Card>
        <Label>What was done? (select all)</Label>
        <Chips color={colors.service} options={allItems.map((k) => ({ key: k, label: k }))} value={items} onChange={toggle} />
        {errors.items ? <Text style={{ color: colors.danger, fontSize: 12, marginTop: 6 }}>{errors.items}</Text> : null}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 14 }}>
          <View style={{ flex: 1 }}>
            <Field label="Other item" value={custom} onChangeText={setCustom} placeholder="Type & tap +" onSubmitEditing={addCustom} />
          </View>
          <Pressable
            onPress={addCustom}
            style={{ marginTop: 26, width: 46, height: 46, borderRadius: 12, backgroundColor: colors.service, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="plus" color="#fff" />
          </Pressable>
        </View>
      </Card>

      <Card>
        <Row>
          <Col>
            <Field label="Parts cost" numeric value={parts} onChangeText={setParts} suffix={settings.currencyCode} placeholder="0" />
          </Col>
          <Col>
            <Field label="Labour cost" numeric value={labor} onChangeText={setLabor} suffix={settings.currencyCode} placeholder="0" />
          </Col>
        </Row>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.serviceSoft, padding: 12, borderRadius: 12 }}>
          <Text style={{ color: colors.service, fontWeight: '700' }}>Total</Text>
          <Text style={{ color: colors.service, fontWeight: '800', fontSize: 18 }}>{fmtMoney(settings, total)}</Text>
        </View>
      </Card>

      <Card>
        <SwitchRow label="Remind next service" hint="Shown on the dashboard" value={reminder} onChange={setReminder} />
        {reminder ? (
          <>
            <Field
              label="Next service at (optional)"
              numeric
              value={nextOdo}
              onChangeText={setNextOdo}
              suffix={unit}
              placeholder={isFinite(parseNum(odometer)) ? String(parseNum(odometer) + 3000) : ''}
            />
            <DateField label="Or by date" value={nextDate} onChange={setNextDate} />
          </>
        ) : null}
        <Field label="Notes (optional)" value={notes} onChangeText={setNotes} multiline placeholder="Mechanic comments, parts brand…" />
      </Card>

      <FormActions
        color={colors.service}
        onSave={save}
        onDelete={
          existing
            ? () => {
                deleteLog('services', existing.id);
                close();
              }
            : undefined
        }
      />
    </Screen>
  );
}
