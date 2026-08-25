/**
 * Cal.com booking config — the one place to edit the scheduling link.
 *
 * Matches the account ContactHero already opens in a modal
 * (cal.com/tahasin-islam-arnob-pw0gbn/30min), so both entry points land on
 * the same event type.
 */
export const CAL_USERNAME = "tahasin-islam-arnob-pw0gbn";
export const CAL_EVENT_SLUG = "30min";
export const CAL_DURATION_MINUTES = 30;

const BOOKING_BASE = `https://cal.com/${CAL_USERNAME}/${CAL_EVENT_SLUG}`;

/**
 * Preselects Google Meet in the booking form's location step, which
 * otherwise opens on "Select on the next step". Cal.com treats this as a
 * prefill, not a lock — the phone and Khulna options stay in the dropdown
 * for anyone who wants them.
 *
 * The param value has to be JSON of this exact shape, and the type string
 * is the one this event type is configured with.
 */
const PREFILL_LOCATION = JSON.stringify({
  value: "integrations:google:meet",
  optionValue: "",
});

/**
 * Built once at module scope — the URL never changes, so there is nothing
 * to recompute per render.
 */
export const EMBED_SRC = `${BOOKING_BASE}?${new URLSearchParams({
  duration: String(CAL_DURATION_MINUTES),
  overlayCalendar: "true",
  embed: "true",
  theme: "dark",
  layout: "month_view",
  location: PREFILL_LOCATION,
})}`;
