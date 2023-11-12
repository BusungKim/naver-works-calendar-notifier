import {FormControlLabel, Radio, RadioGroup} from "@mui/material";

export function CustomRadioGroup({name, value, onChange, items}) {
  return (
    <RadioGroup name={name} onChange={(e) => onChange(e.target.value)} value={value}>
      {items.map((item) =>
        <FormControlLabel
          key={item.value}
          value={item.value}
          control={<Radio size="small"/>}
          label={item.label} />)}
    </RadioGroup>
  );
}
