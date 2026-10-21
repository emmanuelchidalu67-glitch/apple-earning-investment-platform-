import React from 'react';
import { formatUsd, formatNaira, DEFAULT_USD_EXCHANGE_RATE } from '../utils/formatters';

interface DualCurrencyProps {
  kobo: number;
  rate?: number;
  showCents?: boolean;
  prefix?: string;
  suffix?: string;
  usdClassName?: string;
  nairaClassName?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  inline?: boolean;
}

export const DualCurrency: React.FC<DualCurrencyProps> = ({
  kobo,
  rate = DEFAULT_USD_EXCHANGE_RATE,
  showCents = true,
  prefix = '',
  suffix = '',
  usdClassName = 'font-mono font-bold text-white',
  nairaClassName = 'text-[10px] text-slate-400 font-medium',
  align = 'left',
  className = '',
  inline = false,
}) => {
  const usdText = `${prefix}${formatUsd(kobo, showCents, rate)}${suffix}`;
  const nairaText = `≈ ${prefix}${formatNaira(kobo, false)}${suffix}`;

  if (inline) {
    return (
      <span className={`inline-flex items-baseline gap-1.5 ${className}`}>
        <span className={usdClassName}>{usdText}</span>
        <span className={nairaClassName}>({nairaText})</span>
      </span>
    );
  }

  const alignClasses =
    align === 'right'
      ? 'items-end text-right'
      : align === 'center'
      ? 'items-center text-center'
      : 'items-start text-left';

  return (
    <div className={`flex flex-col ${alignClasses} ${className}`}>
      <span className={usdClassName}>{usdText}</span>
      <span className={nairaClassName}>{nairaText}</span>
    </div>
  );
};
