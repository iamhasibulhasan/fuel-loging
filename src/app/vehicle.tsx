import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { close } from '../components/FormParts';
import { Button, Card, Chips, Col, Field, Label, Row, Screen } from '../components/ui';
import { numToInput, parseNum, uid } from '../lib/format';
import { useStore } from '../lib/store';
import type { DistanceUnit, FuelType, PowerUnit, Vehicle, VehicleCategory } from '../lib/types';
import { CATEGORIES, FUEL_TYPES, POWER_UNITS } from '../lib/units';

const DEFAULT_FUEL: Partial<Record<VehicleCategory, FuelType>> = {
  truck: 'diesel',
  bus: 'diesel',
  pickup: 'diesel',
  tractor: 'diesel',
  cng: 'cng',
};

export default function VehicleForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data, settings, saveVehicle, deleteVehicle, setActiveVehicle } = useStore();
  const existing = id ? data.vehicles.find((v) => v.id === id) : undefined;

  const [category, setCategory] = useState<VehicleCategory>(existing?.category ?? 'motorcycle');
  const [name, setName] = useState(existing?.name ?? '');
  const [make, setMake] = useState(existing?.make ?? '');
  const [model, setModel] = useState(existing?.model ?? '');
  const [year, setYear] = useState(existing?.year ?? '');
  const [reg, setReg] = useState(existing?.regNumber ?? '');
  const [fuelType, setFuelType] = useState<FuelType>(existing?.fuelType ?? 'octane');
  const [cc, setCc] = useState(numToInput(existing?.engineCC));
  const [power, setPower] = useState(numToInput(existing?.power));
  const [powerUnit, setPowerUnit] = useState<PowerUnit>(existing?.powerUnit ?? 'hp');
  const [odoUnit, setOdoUnit] = useState<DistanceUnit>(existing?.odometerUnit ?? settings.distanceUnit);
  const [initialOdo, setInitialOdo] = useState(numToInput(existing?.initialOdometer));
  const [tank, setTank] = useState(numToInput(existing?.tankCapacity));
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  const pickCategory = (c: VehicleCategory) => {
    setCategory(c);
    if (!existing) setFuelType(DEFAULT_FUEL[c] ?? 'octane');
  };

  const optNum = (s: string) => {
    const n = parseNum(s);
    return isFinite(n) ? n : null;
  };

  const save = () => {
    const autoName = [make, model].map((x) => x.trim()).filter(Boolean).join(' ');
    const finalName = name.trim() || autoName;
    if (!finalName) {
      setError('Give your vehicle a name (or enter make/model)');
      return;
    }
    const v: Vehicle = {
      id: existing?.id ?? uid(),
      name: finalName,
      category,
      make: make.trim(),
      model: model.trim(),
      year: year.trim(),
      regNumber: reg.trim(),
      fuelType,
      engineCC: optNum(cc),
      power: optNum(power),
      powerUnit,
      odometerUnit: odoUnit,
      initialOdometer: optNum(initialOdo),
      tankCapacity: optNum(tank),
      notes: notes.trim(),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    saveVehicle(v);
    if (!existing) setActiveVehicle(v.id);
    close();
  };

  const remove = () => {
    if (!existing) return;
    Alert.alert(`Delete ${existing.name}?`, 'All fuel, service and oil entries of this vehicle will also be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteVehicle(existing.id);
          close();
        },
      },
    ]);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? 'Edit Vehicle' : 'Add Vehicle' }} />

      <Card>
        <Label>Category</Label>
        <Chips options={CATEGORIES} value={category} onChange={pickCategory} />
      </Card>

      <Card>
        <Field label="Vehicle name" value={name} onChangeText={setName} placeholder="e.g. My Pulsar, Office Car" error={error} />
        <Row>
          <Col>
            <Field label="Make / brand" value={make} onChangeText={setMake} placeholder="Bajaj, Toyota…" />
          </Col>
          <Col>
            <Field label="Model" value={model} onChangeText={setModel} placeholder="Pulsar N160, Axio…" />
          </Col>
        </Row>
        <Row>
          <Col>
            <Field label="Year" value={year} onChangeText={setYear} keyboardType="number-pad" placeholder="2024" maxLength={4} />
          </Col>
          <Col flex={1.4}>
            <Field label="Registration no." value={reg} onChangeText={setReg} placeholder="Dhaka Metro-LA 12-3456" />
          </Col>
        </Row>
      </Card>

      <Card>
        <Label>Fuel type</Label>
        <View style={{ marginBottom: 14 }}>
          <Chips options={FUEL_TYPES} value={fuelType} onChange={setFuelType} />
        </View>
        <Row>
          <Col>
            <Field label="Engine capacity" numeric value={cc} onChangeText={setCc} suffix="cc" placeholder="150" />
          </Col>
          <Col>
            <Field label="Fuel tank" numeric value={tank} onChangeText={setTank} suffix="L" placeholder="12" />
          </Col>
        </Row>
        <Field label="Power" numeric value={power} onChangeText={setPower} suffix={powerUnit} placeholder="15" />
        <View style={{ marginTop: -4, marginBottom: 14 }}>
          <Chips options={POWER_UNITS.map((u) => ({ key: u, label: u }))} value={powerUnit} onChange={setPowerUnit} />
        </View>
      </Card>

      <Card>
        <Label>Odometer unit</Label>
        <View style={{ marginBottom: 14 }}>
          <Chips
            options={[
              { key: 'km' as const, label: 'Kilometres (km)' },
              { key: 'mi' as const, label: 'Miles (mi)' },
            ]}
            value={odoUnit}
            onChange={setOdoUnit}
          />
        </View>
        <Field
          label="Current / starting odometer (optional)"
          numeric
          value={initialOdo}
          onChangeText={setInitialOdo}
          suffix={odoUnit}
          placeholder="0"
          hint="Reading when you start tracking in this app"
        />
        <Field label="Notes (optional)" value={notes} onChangeText={setNotes} multiline placeholder="Chassis no., insurance, etc." />
      </Card>

      <View style={{ gap: 10 }}>
        <Button title={existing ? 'Save changes' : 'Add vehicle'} icon="check" onPress={save} />
        {existing ? <Button title="Delete vehicle" icon="delete-outline" variant="danger" onPress={remove} /> : null}
      </View>
    </Screen>
  );
}
