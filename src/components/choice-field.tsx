'use client';
import {useState} from 'react';
import type {Locale} from '@/lib/routing';

export function ChoiceField({name, label, options, initial = '', required = false, locale, maxLength = 200}: {name: string; label: string; options: string[]; initial?: string; required?: boolean; locale: Locale; maxLength?: number}) {
  const [choice, setChoice] = useState(options.includes(initial) ? initial : initial ? '__custom' : '');
  const [custom, setCustom] = useState(initial);
  return <label className="choice-custom"><span>{label}</span>
    <select value={choice} onChange={event => setChoice(event.target.value)} required={required} aria-label={label}>
      <option value="">{locale === 'zh' ? '请选择' : 'Choose an option'}</option>
      {options.map(option => <option key={option} value={option}>{option}</option>)}
      <option value="__custom">{locale === 'zh' ? '其他 · 自定义填写' : 'Other · enter your own'}</option>
    </select>
    {choice === '__custom' && <input aria-label={`${label} — ${locale === 'zh' ? '自定义' : 'Custom'}`} value={custom} onChange={event => setCustom(event.target.value)} maxLength={maxLength} required={required} />}
    <input type="hidden" name={name} value={choice === '__custom' ? custom : choice} />
  </label>;
}
