export function calculateEMA(prices: number[], window: number): number | null {
  if (prices.length < window || window <= 0) {
    return null;
  }
  const k = 2 / (window + 1);
  let ema = prices[0];
  for (let i = 1; i < prices.length; i += 1) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

export function calculateRSI(prices: number[], period = 14): number | null {
  if (prices.length <= period) {
    return null;
  }
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i += 1) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) {
      gains += diff;
    } else {
      losses -= diff;
    }
  }
  let averageGain = gains / period;
  let averageLoss = losses / period;

  for (let i = period + 1; i < prices.length; i += 1) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) {
      averageGain = (averageGain * (period - 1) + diff) / period;
      averageLoss = (averageLoss * (period - 1)) / period;
    } else {
      averageGain = (averageGain * (period - 1)) / period;
      averageLoss = (averageLoss * (period - 1) - diff) / period;
    }
  }

  if (averageLoss === 0) {
    return 100;
  }

  const rs = averageGain / averageLoss;
  return 100 - 100 / (1 + rs);
}

export function linearRegressionForecast(
  series: Array<{ x: number; y: number }>
): { intercept: number; slope: number; nextY: number; rSquared: number } | null {
  const n = series.length;
  if (n < 3) {
    return null;
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  let sumYY = 0;

  series.forEach(({ x, y }) => {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
    sumYY += y * y;
  });

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) {
    return null;
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  const nextX = series[n - 1].x + 1;
  const nextY = intercept + slope * nextX;

  const ssTot = sumYY - (sumY * sumY) / n;
  const ssRes = series.reduce((acc, { x, y }) => {
    const predicted = intercept + slope * x;
    return acc + (y - predicted) ** 2;
  }, 0);

  const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  return {
    intercept,
    slope,
    nextY,
    rSquared,
  };
}

export function percentile(values: number[], percentage: number): number | null {
  if (!values.length) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((percentage / 100) * sorted.length)));
  return sorted[index];
}
