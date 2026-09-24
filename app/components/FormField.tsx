"use client";

type Common = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

type Props = Common &
  (
    | { as?: "input"; type?: "text" | "email" | "tel"; autoComplete?: string; inputMode?: "text" | "numeric" | "tel" | "email" }
    | { as: "textarea"; rows?: number }
    | { as: "select"; options: string[] }
  );

/* Floating-label field matching the checkout form */
export default function FormField(props: Props) {
  const { id, label, value, onChange, error } = props;
  const shared = {
    id,
    name: id,
    value,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  };

  let control: React.ReactNode;
  if (props.as === "textarea") {
    control = (
      <textarea {...shared} rows={props.rows ?? 5} placeholder=" " onChange={(event) => onChange(event.target.value)} />
    );
  } else if (props.as === "select") {
    control = (
      <select {...shared} data-empty={value ? "false" : "true"} onChange={(event) => onChange(event.target.value)}>
        <option value="" disabled hidden />
        {props.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  } else {
    control = (
      <input
        {...shared}
        type={props.type ?? "text"}
        placeholder=" "
        autoComplete={props.autoComplete}
        inputMode={props.inputMode}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return (
    <div className={`field${props.as === "select" ? " field-select" : ""}${props.as === "textarea" ? " field-textarea" : ""}${error ? " has-error" : ""}`}>
      {control}
      <label htmlFor={id}>{label}</label>
      {error && (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
