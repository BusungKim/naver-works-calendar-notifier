import React from 'react';
import {
  FormControl, InputLabel, MenuItem, Select,
} from '@mui/material';

export function CustomSelect({
  name, value, onChange, items,
}) {
  return (
    <FormControl fullWidth>
      <InputLabel id="demo-simple-select-label">{name}</InputLabel>
      <Select
        labelId={`select-label-${name}`}
        id={`select-id-${name}"`}
        value={value}
        label={name}
        size="small"
        onChange={(e) => onChange(e.target.value)}
      >
        {items.map((item) => (
          <MenuItem key={item.value} value={item.value}>
            {item.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
