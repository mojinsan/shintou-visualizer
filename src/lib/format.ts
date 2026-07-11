const UNITS: { v: number; n: string }[] = [
  { v: 1e68, n: "無量大数" }, { v: 1e64, n: "不可思議" }, { v: 1e60, n: "那由他" },
  { v: 1e56, n: "阿僧祇" },   { v: 1e52, n: "恒河沙" },   { v: 1e48, n: "極" },
  { v: 1e44, n: "載" },       { v: 1e40, n: "正" },       { v: 1e36, n: "澗" },
  { v: 1e32, n: "溝" },       { v: 1e28, n: "穣" },       { v: 1e24, n: "秭" },
  { v: 1e20, n: "垓" },       { v: 1e16, n: "京" },       { v: 1e12, n: "兆" },
  { v: 1e8,  n: "億" },       { v: 1e4,  n: "万" },
];

export function formatJa(x: number): string {
  if (!isFinite(x)) return "∞";
  if (x < 1) return "0";
  if (x < 1e4) return Math.round(x).toLocaleString("ja-JP");
  for (const u of UNITS) {
    if (x >= u.v) {
      const val = x / u.v;
      const d = val >= 100 ? 0 : val >= 10 ? 1 : 2;
      return `${val.toFixed(d)}${u.n}`;
    }
  }
  return Math.round(x).toLocaleString("ja-JP");
}

export const formatSci = (x: number) => x.toExponential(2);
