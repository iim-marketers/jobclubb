export const SUPPLIER = {
  brand: "JobClubb",
  legalName: "RAAISHA TECHNOLOGIES PRIVATE LIMITED",
  gstin: "19AAOCR5402J1Z1",
  address: ["2A, Ganesh Chandra Avenue, Dharmatala", "Kolkata, West Bengal 700013"],
  stateCode: "19",
  sac: "998511",
} as const;

export const PLACEMENT_SAC = "998512";

export const GST_RATE = 18;

export const GST_STATES: Record<string, string> = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "26": "Dadra and Nagar Haveli and Daman and Diu",
  "27": "Maharashtra",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
};

// Order matters: exceptions and carved-out ranges must come before the
// broader ranges they sit inside.
const PIN_EXCEPTIONS: [prefix: string, state: string][] = [
  ["68255", "31"],
  ["2476", "05"],
  ["2477", "05"],
  ["2623", "05"],
  ["2624", "05"],
  ["2625", "05"],
  ["3962", "26"],
  ["6050", "34"],
  ["6051", "34"],
  ["6096", "34"],
];

const PIN_RANGES: [from: number, to: number, state: string][] = [
  [110, 110, "07"],
  [121, 136, "06"],
  [140, 159, "03"],
  [160, 160, "04"],
  [171, 177, "02"],
  [180, 193, "01"],
  [194, 194, "38"],
  [246, 246, "05"],
  [248, 249, "05"],
  [263, 263, "05"],
  [201, 285, "09"],
  [301, 345, "08"],
  [360, 396, "24"],
  [403, 403, "30"],
  [400, 445, "27"],
  [450, 488, "23"],
  [490, 497, "22"],
  [500, 509, "36"],
  [515, 535, "37"],
  [560, 591, "29"],
  [600, 643, "33"],
  [670, 695, "32"],
  [737, 737, "11"],
  [744, 744, "35"],
  [700, 743, "19"],
  [751, 770, "21"],
  [781, 788, "18"],
  [790, 792, "12"],
  [793, 794, "17"],
  [795, 795, "14"],
  [796, 796, "15"],
  [797, 798, "13"],
  [799, 799, "16"],
  [814, 816, "20"],
  [822, 822, "20"],
  [825, 835, "20"],
  [800, 855, "10"],
];

export function pincodeState(pincode: string): string | null {
  if (!/^\d{6}$/.test(pincode)) return null;
  const exception = PIN_EXCEPTIONS.find(([prefix]) => pincode.startsWith(prefix));
  if (exception) return exception[1];
  const prefix = Number(pincode.slice(0, 3));
  const range = PIN_RANGES.find(([from, to]) => prefix >= from && prefix <= to);
  return range?.[2] ?? null;
}

// Unknown location falls back to the supplier's state (IGST Act s.12(2)(b)).
export function stateFromPincode(pincode: string) {
  return pincodeState(pincode) ?? SUPPLIER.stateCode;
}

export const stateLabel = (code: string) => `${GST_STATES[code] ?? "Unknown"} (${code})`;

export type GstSplit = {
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
};

export function splitGst(amount: number, placeOfSupply: string): GstSplit {
  const taxable = Math.round((amount * 100) / (100 + GST_RATE));
  const tax = amount - taxable;
  if (placeOfSupply !== SUPPLIER.stateCode) return { taxable, cgst: 0, sgst: 0, igst: tax };
  const cgst = Math.floor(tax / 2);
  return { taxable, cgst, sgst: tax - cgst, igst: 0 };
}

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function belowHundred(n: number) {
  return n < 20 ? ONES[n] : [TENS[Math.floor(n / 10)], ONES[n % 10]].filter(Boolean).join("-");
}

function belowThousand(n: number) {
  const hundreds = Math.floor(n / 100);
  return [hundreds ? `${ONES[hundreds]} Hundred` : "", belowHundred(n % 100)].filter(Boolean).join(" ");
}

function inWords(n: number): string {
  if (n === 0) return "Zero";
  const parts = [
    [Math.floor(n / 10_000_000), "Crore"],
    [Math.floor((n % 10_000_000) / 100_000), "Lakh"],
    [Math.floor((n % 100_000) / 1000), "Thousand"],
  ] as const;
  return [
    ...parts
      .filter(([v]) => v)
      .map(([v, unit]) => `${unit === "Crore" ? inWords(v) : belowHundred(v)} ${unit}`),
    belowThousand(n % 1000),
  ]
    .filter(Boolean)
    .join(" ");
}

export function amountInWords(paise: number) {
  const rupees = Math.floor(paise / 100);
  const rest = paise % 100;
  return `Rupees ${inWords(rupees)}${rest ? ` and ${inWords(rest)} Paise` : ""} Only`;
}
