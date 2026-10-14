export const USD_TO_BDT = 123.15;

export const formatBdt = (value) =>
  `৳${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

export const usdToBdt = (usd) => Math.round((Number(usd) || 0) * USD_TO_BDT);

export const bdtToUsd = (bdt) =>
  Math.round(((Number(bdt) || 0) / USD_TO_BDT) * 100) / 100;
