'use client';

import { useState, useSyncExternalStore } from 'react';

export type RecordFamily = { id: string; name: string; variables: { key: string; name: string }[] };
const subscribe = () => () => {};

export function OrbitaSeriesSelect({ families, selected }: { families: RecordFamily[]; selected: string }) {
  const [familyId, setFamilyId] = useState(families.find(family => family.variables.some(option => option.key === selected))?.id ?? families[0].id);
  const family = families.find(item => item.id === familyId)!;
  const [variable, setVariable] = useState(selected);
  const interactive = useSyncExternalStore(subscribe, () => true, () => false);
  return <>
    <label>Dataset<select disabled={!interactive} value={familyId} onChange={event => {
      const next = families.find(item => item.id === event.currentTarget.value)!;
      setFamilyId(next.id);
      setVariable(next.variables[0].key);
    }}>{families.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <label>Variable<select name="series" value={variable} onChange={event => setVariable(event.currentTarget.value)}>
      {interactive ? family.variables.map(option => <option key={option.key} value={option.key}>{option.name}</option>) :
        families.map(item => <optgroup key={item.id} label={item.name}>{item.variables.map(option =>
          <option key={option.key} value={option.key}>{option.name}</option>)}</optgroup>)}
    </select></label>
  </>;
}
