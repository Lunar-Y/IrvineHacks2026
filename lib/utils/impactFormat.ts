export const formatKg = (value: number): string => `${Math.round(value).toLocaleString()} kg`;

export const formatLiters = (value: number): string => `${Math.round(value).toLocaleString()} L`;

export const formatCount = (value: number): string => `${Math.max(0, Math.round(value))}`;

export const formatHeatIndex = (value: number): string => `-${value.toFixed(1)}°F`;

export const formatPercent = (value: number): string => `${Math.round(value)}%`;
