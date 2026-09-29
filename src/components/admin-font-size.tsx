'use client';
import {useId, useState} from 'react';
export function AdminFontSize({label, value, onChange, disabled = false}: {label:string; value?:number; onChange:(value?:number)=>void; disabled?:boolean}) {
  const id=useId();
  const [pending, setPending] = useState<string | null>(null);
  return <div className="cms-font-control"><label htmlFor={id}>{label}字号</label><input id={id} type="number" min={12} max={96} step={1} placeholder="默认" value={pending ?? value ?? ''} disabled={disabled} onFocus={() => setPending(String(value ?? ''))} onBlur={() => setPending(null)} onChange={e=>{setPending(e.target.value);if(!e.target.value) onChange(undefined);else if(e.currentTarget.validity.valid) onChange(Number(e.target.value));}}/><span>px</span><button type="button" disabled={disabled || value === undefined} onClick={()=>{setPending(null);onChange(undefined);}}>恢复默认</button></div>;
}
