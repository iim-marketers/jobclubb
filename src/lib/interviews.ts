import type { InterviewMode } from "@/lib/candidate-activity";
import type { FieldErrors } from "@/lib/sign-up-validation";

export const INTERVIEW_MODES = [
  { value: "video", label: "Video call" },
  { value: "in_person", label: "In-person" },
  { value: "phone", label: "Phone" },
] as const satisfies readonly { value: string; label: InterviewMode }[];

export type InterviewModeValue = (typeof INTERVIEW_MODES)[number]["value"];

export const modeLabel = (value: string): InterviewMode =>
  INTERVIEW_MODES.find((m) => m.value === value)?.label ?? "Video call";

export const modeValue = (label: InterviewMode): InterviewModeValue =>
  INTERVIEW_MODES.find((m) => m.label === label)?.value ?? "video";

export type RemoteMode = Exclude<InterviewModeValue, "in_person">;

export const PLACE_FIELD: Record<
  RemoteMode,
  { label: string; placeholder: string; hint: string }
> = {
  video: {
    label: "Meeting link",
    placeholder: "e.g. https://meet.google.com/abc-defg-hij",
    hint: "The candidate joins from their Interviews page.",
  },
  phone: {
    label: "Number to call",
    placeholder: "e.g. 9876543210",
    hint: "The candidate's number stays private, so they call you on this one.",
  },
};

export const DURATIONS = [15, 30, 45, 60, 90, 120] as const;

export const OUTCOME_LABELS = {
  next_round: "Cleared",
  selected: "Selected",
  not_selected: "Not selected",
} as const;

export type InterviewOutcome = keyof typeof OUTCOME_LABELS;
export type InterviewOutcomeLabel = (typeof OUTCOME_LABELS)[InterviewOutcome];

export const MAX_ROUNDS = 10;

export type Venue = {
  address: string;
  landmark: string | null;
  city: string;
  pincode: string;
};

export const venueText = (v: Venue) => `${v.address}, ${v.city} ${v.pincode}`;

export type InterviewInput = {
  startsAt: string;
  durationMins: number;
  mode: InterviewModeValue;
  place: string | null;
  venue: Venue | null;
  interviewer: string;
  round: string;
};

export type InterviewPlaceRow = {
  place: string | null;
  address: string | null;
  landmark: string | null;
  city: string | null;
  pincode: string | null;
};

export const PLACE_COLUMNS = "place, address, landmark, city, pincode";

export function interviewPlace(row: InterviewPlaceRow) {
  const venue =
    row.address && row.city && row.pincode
      ? {
          address: row.address,
          landmark: row.landmark,
          city: row.city,
          pincode: row.pincode,
        }
      : null;
  return { place: venue ? venueText(venue) : (row.place ?? ""), venue };
}

const IST = "Asia/Kolkata";
const MAX_DAYS_AHEAD = 180;

const text = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim();

export function istDateTime(iso: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: IST,
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

export type InterviewPhase = "upcoming" | "live" | "ended";

export function interviewEnd(startsAt: string, durationMins: number, finishedAt: string | null) {
  const planned = Date.parse(startsAt) + durationMins * 60_000;
  return new Date(finishedAt ? Math.min(Date.parse(finishedAt), planned) : planned).toISOString();
}

export function interviewPhase(i: { startsAt: string; endsAt: string }, now: Date): InterviewPhase {
  if (+now < Date.parse(i.startsAt)) return "upcoming";
  return +now < Date.parse(i.endsAt) ? "live" : "ended";
}

export const formatIst = (iso: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-IN", { ...options, timeZone: IST }).format(new Date(iso));

export function relativeDay(iso: string, now: Date) {
  const days = Math.round(
    (Date.parse(istDateTime(iso).date) - Date.parse(istDateTime(now.toISOString()).date)) /
      86_400_000,
  );
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return days > 0 ? `In ${days} days` : `${-days} days ago`;
}

function placeError(mode: RemoteMode, place: string) {
  if (!place) return `Enter the ${PLACE_FIELD[mode].label.toLowerCase()}.`;
  if (place.length > 300) return "Use 300 characters or fewer.";
  if (mode === "video") {
    let url: URL | null = null;
    try {
      url = new URL(place);
    } catch {}
    if (url?.protocol !== "https:")
      return "Enter a link starting with https://.";
  }
  if (mode === "phone") {
    const digits = place.replace(/\D/g, "").length;
    if (!/^[+\d\s()-]+$/.test(place) || digits < 10 || digits > 13)
      return "Enter a phone number with 10 to 13 digits.";
  }
}

export function validateInterview(
  formData: FormData,
  now = new Date(),
): { values: InterviewInput; errors: FieldErrors } {
  const date = text(formData, "date");
  const time = text(formData, "time");
  const mode = text(formData, "mode") as InterviewModeValue;
  const startsAt = new Date(`${date}T${time}:00+05:30`);
  const inPerson = mode === "in_person";
  const venue: Venue = {
    address: text(formData, "address"),
    landmark: text(formData, "landmark") || null,
    city: text(formData, "city"),
    pincode: text(formData, "pincode"),
  };
  const values: InterviewInput = {
    startsAt: Number.isNaN(+startsAt) ? "" : startsAt.toISOString(),
    durationMins: Number(text(formData, "duration")),
    mode,
    place: inPerson ? null : text(formData, "place"),
    venue: inPerson ? venue : null,
    interviewer: text(formData, "interviewer"),
    round: text(formData, "round"),
  };
  const errors: FieldErrors = {};

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.date = "Choose a date.";
  else if (!/^\d{2}:\d{2}$/.test(time)) errors.time = "Choose a time.";
  else if (!values.startsAt) errors.date = "Choose a valid date.";
  else if (+startsAt <= +now) errors.time = "Choose a time in the future.";
  else if (+startsAt - +now > MAX_DAYS_AHEAD * 86_400_000)
    errors.date = `Schedule within the next ${MAX_DAYS_AHEAD} days.`;

  if (!(DURATIONS as readonly number[]).includes(values.durationMins))
    errors.duration = "Choose a duration.";

  if (!INTERVIEW_MODES.some((m) => m.value === mode))
    errors.mode = "Choose how you'll meet.";
  else if (inPerson) {
    if (!venue.address) errors.address = "Enter the building, street and area.";
    else if (venue.address.length > 200)
      errors.address = "Use 200 characters or fewer.";
    if (venue.landmark && venue.landmark.length > 100)
      errors.landmark = "Use 100 characters or fewer.";
    if (!venue.city) errors.city = "Enter the city.";
    else if (venue.city.length > 80)
      errors.city = "Use 80 characters or fewer.";
    if (!/^\d{6}$/.test(venue.pincode))
      errors.pincode = "Enter a 6-digit pincode.";
  } else {
    const place = placeError(mode, values.place ?? "");
    if (place) errors.place = place;
  }

  if (!values.interviewer)
    errors.interviewer = "Enter who will take the interview.";
  else if (values.interviewer.length > 80)
    errors.interviewer = "Use 80 characters or fewer.";
  if (!values.round) errors.round = "Name this round, like HR round.";
  else if (values.round.length > 60)
    errors.round = "Use 60 characters or fewer.";

  return { values, errors };
}
