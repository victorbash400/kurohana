type FormFieldProps = {
  label: string;
  name: string;
  value: string;
  type?: string;
  step?: string;
  min?: number;
  max?: number;
  onChange: (value: string) => void;
};

export function FormField({
  label,
  name,
  value,
  type = "number",
  step,
  min,
  max,
  onChange,
}: FormFieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm text-black">
      <span className="font-medium">{label}</span>
      <input
        name={name}
        value={value}
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        step={step}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-black/15 bg-white px-3 py-2 text-sm text-black shadow-inner focus:outline-none focus:ring-2 focus:ring-black/40"
      />
    </label>
  );
}
