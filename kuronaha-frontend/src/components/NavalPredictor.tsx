"use client";

import { useMemo, useState } from "react";
import { Card } from "./Card";
import { FormField } from "./FormField";
import { postJson } from "@/lib/api";

type NavalResponse = {
  predictions: {
    compressor_decay: number;
    turbine_decay: number;
  };
  feature_importance: {
    compressor: Record<string, number>;
    turbine: Record<string, number>;
  };
};

type NavalPayload = {
  Lever_position: number;
  Ship_speed_knots: number;
  Gas_Turbine_shaft_torque_kN_m: number;
  Gas_Turbine_rate_of_revolutions_rpm: number;
  Gas_Generator_rate_of_revolutions_rpm: number;
  Starboard_Propeller_Torque_kN: number;
  Port_Propeller_Torque_kN: number;
  HP_Turbine_exit_temperature_C: number;
  GT_Compressor_inlet_air_temperature_C: number;
  GT_Compressor_outlet_air_temperature_C: number;
  HP_Turbine_exit_pressure_psi: number;
  GT_Compressor_inlet_air_pressure_psi: number;
  GT_Compressor_outlet_air_pressure_bar: number;
  Gas_Turbine_exhaust_gas_pressure_psi: number;
  Turbine_Injecton_Control: number;
  Fuel_flow_lg_s: number;
};

type NavalField = {
  name: keyof NavalPayload;
  label: string;
  step?: string;
};

const NAVAL_FIELDS: NavalField[] = [
  { name: "Lever_position", label: "Lever position", step: "0.01" },
  { name: "Ship_speed_knots", label: "Ship speed", step: "0.1" },
  { name: "Gas_Turbine_shaft_torque_kN_m", label: "Shaft torque", step: "0.1" },
  { name: "Gas_Turbine_rate_of_revolutions_rpm", label: "Turbine RPM", step: "1" },
  { name: "Gas_Generator_rate_of_revolutions_rpm", label: "Generator RPM", step: "1" },
  { name: "Starboard_Propeller_Torque_kN", label: "Starboard torque", step: "0.1" },
  { name: "Port_Propeller_Torque_kN", label: "Port torque", step: "0.1" },
  { name: "HP_Turbine_exit_temperature_C", label: "HP exit temperature", step: "0.1" },
  { name: "GT_Compressor_inlet_air_temperature_C", label: "Compressor inlet temp", step: "0.1" },
  { name: "GT_Compressor_outlet_air_temperature_C", label: "Compressor outlet temp", step: "0.1" },
  { name: "HP_Turbine_exit_pressure_psi", label: "HP exit pressure", step: "0.01" },
  { name: "GT_Compressor_inlet_air_pressure_psi", label: "Inlet pressure", step: "0.01" },
  { name: "GT_Compressor_outlet_air_pressure_bar", label: "Outlet pressure", step: "0.01" },
  { name: "Gas_Turbine_exhaust_gas_pressure_psi", label: "Exhaust pressure", step: "0.01" },
  { name: "Turbine_Injecton_Control", label: "Turbine injection control", step: "0.01" },
  { name: "Fuel_flow_lg_s", label: "Fuel flow", step: "0.01" },
];

const NAVAL_PRESETS = {
  drydock: {
    label: "Dry dock",
    payload: {
      Lever_position: 0.52,
      Ship_speed_knots: 14.8,
      Gas_Turbine_shaft_torque_kN_m: 490,
      Gas_Turbine_rate_of_revolutions_rpm: 3600,
      Gas_Generator_rate_of_revolutions_rpm: 8100,
      Starboard_Propeller_Torque_kN: 460,
      Port_Propeller_Torque_kN: 458,
      HP_Turbine_exit_temperature_C: 840,
      GT_Compressor_inlet_air_temperature_C: 294,
      GT_Compressor_outlet_air_temperature_C: 452,
      HP_Turbine_exit_pressure_psi: 16,
      GT_Compressor_inlet_air_pressure_psi: 14.5,
      GT_Compressor_outlet_air_pressure_bar: 17.5,
      Gas_Turbine_exhaust_gas_pressure_psi: 15.8,
      Turbine_Injecton_Control: 1.6,
      Fuel_flow_lg_s: 0.78,
    } satisfies NavalPayload,
  },
  seaTrial: {
    label: "Sea trial",
    payload: {
      Lever_position: 0.64,
      Ship_speed_knots: 21.3,
      Gas_Turbine_shaft_torque_kN_m: 585,
      Gas_Turbine_rate_of_revolutions_rpm: 4200,
      Gas_Generator_rate_of_revolutions_rpm: 9300,
      Starboard_Propeller_Torque_kN: 520,
      Port_Propeller_Torque_kN: 522,
      HP_Turbine_exit_temperature_C: 905,
      GT_Compressor_inlet_air_temperature_C: 299,
      GT_Compressor_outlet_air_temperature_C: 470,
      HP_Turbine_exit_pressure_psi: 17.2,
      GT_Compressor_inlet_air_pressure_psi: 15.2,
      GT_Compressor_outlet_air_pressure_bar: 18.4,
      Gas_Turbine_exhaust_gas_pressure_psi: 16.3,
      Turbine_Injecton_Control: 1.9,
      Fuel_flow_lg_s: 0.91,
    } satisfies NavalPayload,
  },
} as const;

type NavalPresetKey = keyof typeof NAVAL_PRESETS;

export function NavalPredictor() {
  const [presetKey, setPresetKey] = useState<NavalPresetKey>("drydock");
  const [form, setForm] = useState<Record<string, string>>(() =>
    mapPayloadToStrings(NAVAL_PRESETS.drydock.payload)
  );
  const [result, setResult] = useState<NavalResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compressorTop = useMemo(() => pickTop(result?.feature_importance.compressor), [
    result,
  ]);
  const turbineTop = useMemo(() => pickTop(result?.feature_importance.turbine), [result]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const hasEmpty = Object.values(form).some((value) => value === "");
    if (hasEmpty) {
      setError("Fill every field before predicting.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = mapStringsToPayload(form) as NavalPayload;
      const response = await postJson<NavalResponse>(
        "/predict/naval",
        payload,
        "naval predict"
      );
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to predict");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setForm(mapPayloadToStrings(NAVAL_PRESETS[presetKey].payload));
  }

  function handlePresetChange(key: NavalPresetKey) {
    setPresetKey(key);
    setForm(mapPayloadToStrings(NAVAL_PRESETS[key].payload));
  }

  return (
    <Card
      title="Naval degradation"
      description="Track compressor and turbine decay deltas from a single payload."
      actions={
        <div className="flex items-center gap-3 text-sm">
          <label className="flex items-center gap-2">
            <span className="uppercase tracking-[0.3em] text-black/50">Preset</span>
            <select
              value={presetKey}
              onChange={(event) => handlePresetChange(event.target.value as NavalPresetKey)}
              className="rounded-full border border-black/20 bg-transparent px-3 py-1 text-black focus:outline-none"
            >
              {(Object.keys(NAVAL_PRESETS) as NavalPresetKey[]).map((key) => (
                <option key={key} value={key}>
                  {NAVAL_PRESETS[key].label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handleReset}
            className="font-semibold text-black underline-offset-4 hover:underline"
          >
            Apply
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {NAVAL_FIELDS.map((field) => (
            <FormField
              key={field.name}
              label={field.label}
              name={field.name}
              value={form[field.name] ?? ""}
              step={field.step}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  [field.name]: value,
                }))
              }
            />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:bg-black/40"
          >
            {loading ? "Predicting" : "Predict naval"}
          </button>
          {error && <p className="text-sm text-black/70">{error}</p>}
        </div>
      </form>
      {result && (
        <div className="mt-6 space-y-5 text-sm text-black">
          <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <MetricTile label="Compressor decay" value={result.predictions.compressor_decay} />
              <MetricTile label="Turbine decay" value={result.predictions.turbine_decay} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <InfluenceList title="Compressor influence" items={compressorTop} />
            <InfluenceList title="Turbine influence" items={turbineTop} />
          </div>
        </div>
      )}
    </Card>
  );
}

type MetricTileProps = {
  label: string;
  value: number;
};

function MetricTile({ label, value }: MetricTileProps) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-4 text-center">
      <p className="text-xs uppercase tracking-wide text-black/60">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value.toFixed(3)}</p>
    </div>
  );
}

type InfluenceListProps = {
  title: string;
  items: Array<[string, number]>;
};

function InfluenceList({ title, items }: InfluenceListProps) {
  if (!items.length) return null;

  return (
    <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-black/60">{title}</p>
      <ul className="mt-3 space-y-1">
        {items.map(([name, value]) => (
          <li key={name} className="flex items-center justify-between text-sm">
            <span className="text-black/80">{name.replace(/_/g, " ")}</span>
            <span className="font-mono">{value.toFixed(3)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function mapPayloadToStrings<T extends Record<string, number>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, String(value)])
  );
}

function mapStringsToPayload(values: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, Number(value)])
  );
}

function pickTop(values?: Record<string, number>) {
  if (!values) return [] as Array<[string, number]>;
  return Object.entries(values)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 5);
}
