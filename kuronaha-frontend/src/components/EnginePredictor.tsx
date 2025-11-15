"use client";

import { useMemo, useState } from "react";
import { Card } from "./Card";
import { FormField } from "./FormField";
import { postJson } from "@/lib/api";

type EngineResponse = {
  prediction: number;
  condition: string;
  probabilities: Record<string, number>;
  feature_importance: Record<string, number>;
};

type FieldConfig = {
  name: keyof EnginePayload;
  label: string;
  step?: string;
};

type EnginePayload = {
  Lever_position: number;
  Ship_speed: number;
  Gas_Turbine_shaft_torque: number;
  Gas_Turbine_rate_of_revolutions: number;
  Gas_Generator_rate_of_revolutions: number;
  Starboard_Propeller_Torque: number;
  Port_Propeller_Torque: number;
  HP_Turbine_exit_temperature: number;
  GT_Compressor_inlet_air_temperature: number;
  GT_Compressor_outlet_air_temperature: number;
  HP_Turbine_exit_pressure: number;
};

const ENGINE_FIELDS: FieldConfig[] = [
  { name: "Lever_position", label: "Lever position", step: "0.01" },
  { name: "Ship_speed", label: "Ship speed (knots)", step: "0.1" },
  { name: "Gas_Turbine_shaft_torque", label: "Shaft torque", step: "1" },
  { name: "Gas_Turbine_rate_of_revolutions", label: "Turbine RPM", step: "1" },
  { name: "Gas_Generator_rate_of_revolutions", label: "Generator RPM", step: "1" },
  { name: "Starboard_Propeller_Torque", label: "Starboard torque", step: "1" },
  { name: "Port_Propeller_Torque", label: "Port torque", step: "1" },
  { name: "HP_Turbine_exit_temperature", label: "HP exit temperature", step: "0.1" },
  { name: "GT_Compressor_inlet_air_temperature", label: "Compressor inlet temp", step: "0.1" },
  { name: "GT_Compressor_outlet_air_temperature", label: "Compressor outlet temp", step: "0.1" },
  { name: "HP_Turbine_exit_pressure", label: "HP exit pressure", step: "0.01" },
];

const ENGINE_PRESETS = {
  cruise: {
    label: "Cruise telemetry",
    payload: {
      Lever_position: 0.51,
      Ship_speed: 15.4,
      Gas_Turbine_shaft_torque: 510,
      Gas_Turbine_rate_of_revolutions: 3500,
      Gas_Generator_rate_of_revolutions: 7900,
      Starboard_Propeller_Torque: 455,
      Port_Propeller_Torque: 447,
      HP_Turbine_exit_temperature: 850,
      GT_Compressor_inlet_air_temperature: 295,
      GT_Compressor_outlet_air_temperature: 450,
      HP_Turbine_exit_pressure: 15.5,
    } satisfies EnginePayload,
  },
  surge: {
    label: "Surge telemetry",
    payload: {
      Lever_position: 0.78,
      Ship_speed: 9.4,
      Gas_Turbine_shaft_torque: 690,
      Gas_Turbine_rate_of_revolutions: 4020,
      Gas_Generator_rate_of_revolutions: 8800,
      Starboard_Propeller_Torque: 520,
      Port_Propeller_Torque: 515,
      HP_Turbine_exit_temperature: 910,
      GT_Compressor_inlet_air_temperature: 302,
      GT_Compressor_outlet_air_temperature: 480,
      HP_Turbine_exit_pressure: 18.2,
    } satisfies EnginePayload,
  },
} as const;

type EnginePresetKey = keyof typeof ENGINE_PRESETS;

export function EnginePredictor() {
  const [presetKey, setPresetKey] = useState<EnginePresetKey>("cruise");
  const [form, setForm] = useState<Record<string, string>>(() =>
    mapPayloadToStrings(ENGINE_PRESETS["cruise"].payload)
  );
  const [result, setResult] = useState<EngineResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topFeatures = useMemo(() => {
    if (!result) return [];
    return Object.entries(result.feature_importance)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 5);
  }, [result]);

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
      const payload = mapStringsToPayload(form) as EnginePayload;
      const response = await postJson<EngineResponse>(
        "/predict/engine",
        payload,
        "engine predict"
      );
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to predict");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setForm(mapPayloadToStrings(ENGINE_PRESETS[presetKey].payload));
  }

  function handlePresetChange(key: EnginePresetKey) {
    setPresetKey(key);
    setForm(mapPayloadToStrings(ENGINE_PRESETS[key].payload));
  }

  return (
    <Card
      title="Engine faults"
      description="Feed turbine telemetry and classify the condition instantly."
      actions={
        <div className="flex items-center gap-3 text-sm">
          <label className="flex items-center gap-2">
            <span className="uppercase tracking-[0.3em] text-black/50">Preset</span>
            <select
              value={presetKey}
              onChange={(event) => handlePresetChange(event.target.value as EnginePresetKey)}
              className="rounded-full border border-black/20 bg-transparent px-3 py-1 text-black focus:outline-none"
            >
              {(Object.keys(ENGINE_PRESETS) as EnginePresetKey[]).map((key) => (
                <option key={key} value={key}>
                  {ENGINE_PRESETS[key].label}
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
          {ENGINE_FIELDS.map((field) => (
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
            {loading ? "Predicting" : "Predict engine"}
          </button>
          {error && <p className="text-sm text-black/70">{error}</p>}
        </div>
      </form>
      {result && (
        <div className="mt-6 space-y-4 rounded-2xl border border-black/10 bg-black/[0.02] p-4 text-sm text-black">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-black/60">
            <span>Condition</span>
            <span className="text-base font-semibold text-black/90 tracking-tight">
              {result.condition}
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {Object.entries(result.probabilities).map(([key, value]) => (
              <div key={key} className="rounded-xl border border-black/10 p-3 text-center">
                <p className="text-xs uppercase tracking-wide text-black/60">
                  {key.replace(/_/g, " ")}
                </p>
                <p className="text-lg font-semibold">
                  {(value * 100).toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-black/60">
              Feature influence
            </p>
            <ul className="mt-2 space-y-1">
              {topFeatures.map(([name, value]) => (
                <li key={name} className="flex items-center justify-between">
                  <span className="text-sm text-black/80">{name.replace(/_/g, " ")}</span>
                  <span className="font-mono text-sm">{value.toFixed(3)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
}

function mapPayloadToStrings(payload: EnginePayload) {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, String(value)])
  );
}

function mapStringsToPayload(values: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, Number(value)])
  );
}
