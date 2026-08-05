/**
 * Standardized parsing utility for order customer details, delivery location,
 * scheduled dates/times, and operational notes coming from Cloudflare D1.
 */

export type StandardizedOrderDetails = {
  cleanCustomerName: string;
  deliveryLocation: string;
  scheduledDeliveryDate?: string; // YYYY-MM-DD
  scheduledDeliveryTime?: string;
  isScheduled: boolean;
  deliveryDateLabel: string;
  cleanNotes: string;
};

const FIXTURE_TAG_PATTERN = /\[FIXTURE:[^\]]+\]/gi;

export function parseOrderCustomerDetails(
  rawCustomerName?: string,
  rawNotes?: string,
  createdAtIso?: string,
): StandardizedOrderDetails {
  let customerText = (rawCustomerName || "").replace(FIXTURE_TAG_PATTERN, "").trim();
  let notesText = (rawNotes || "").replace(FIXTURE_TAG_PATTERN, "").trim();

  let location = "Sin ubicación";
  let scheduledDate: string | undefined = undefined;
  let scheduledTime: string | undefined = undefined;
  let isScheduled = false;
  let extractedNote = "";

  // 1. Extract location from customer name format: "Name (Torre GGA)"
  const locationMatch = customerText.match(/\((Torre [^)]+)\)/i);
  if (locationMatch?.[1]) {
    location = locationMatch[1].trim();
    customerText = customerText.replace(/\((Torre [^)]+)\)/gi, "").trim();
  }

  // 2. Extract scheduled delivery info from bracket format: [ENTREGA PROGRAMADA: 2026-08-10 (a partir de la 1:30 PM)]
  const scheduledMatch = customerText.match(/\[ENTREGA PROGRAMADA:\s*(\d{4}-\d{2}-\d{2})(?:\s*\(([^)]+)\))?\]/i);
  if (scheduledMatch) {
    scheduledDate = scheduledMatch[1];
    scheduledTime = scheduledMatch[2]?.trim() || "a partir de la 1:30 PM";
    isScheduled = true;
    customerText = customerText.replace(/\[ENTREGA PROGRAMADA:[^\]]+\]/gi, "").trim();
  }

  // 3. Extract same-day delivery info from bracket format: [Entrega hoy a partir de la 1:30 PM]
  const todayMatch = customerText.match(/\[Entrega hoy(?:\s*([^\]]+))?\]/i);
  if (todayMatch) {
    scheduledTime = todayMatch[1]?.trim() || "a partir de la 1:30 PM";
    customerText = customerText.replace(/\[Entrega hoy[^\]]*\]/gi, "").trim();
  }

  // 4. Extract embedded notes from customer text bracket: [Nota: ...]
  const embeddedNoteMatch = customerText.match(/\[Nota:\s*([^\]]+)\]/i);
  if (embeddedNoteMatch?.[1]) {
    extractedNote = embeddedNoteMatch[1].trim();
    customerText = customerText.replace(/\[Nota:[^\]]+\]/gi, "").trim();
  }

  // 5. Check notes for location fallback: "Ubicación: Torre GGA | Note"
  if (location === "Sin ubicación" && notesText) {
    const locInNotes = notesText.match(/Ubicación:\s*([^\n|]+)/i);
    if (locInNotes?.[1]) {
      location = locInNotes[1].trim();
      notesText = notesText.replace(/Ubicación:\s*[^\n|]+\|?/i, "").trim();
    }
  }

  // Clean remaining notes
  const combinedNotes = [notesText, extractedNote]
    .map((n) => n.trim())
    .filter(Boolean)
    .join(" · ");

  // Format delivery date label
  let deliveryDateLabel = "Hoy";
  if (isScheduled && scheduledDate) {
    const [y, m, d] = scheduledDate.split("-").map(Number);
    if (y && m && d) {
      const dateObj = new Date(y, m - 1, d);
      const dayName = dateObj.toLocaleDateString("es-MX", { weekday: "short" });
      const monthName = dateObj.toLocaleDateString("es-MX", { month: "short" });
      const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      deliveryDateLabel = `${capitalizedDay} ${d} ${capitalizedMonth}`;
    } else {
      deliveryDateLabel = scheduledDate;
    }
  }

  const cleanCustomerName = customerText.replace(/\s{2,}/g, " ").trim() || "Cliente";

  return {
    cleanCustomerName,
    deliveryLocation: location,
    scheduledDeliveryDate: scheduledDate,
    scheduledDeliveryTime: scheduledTime,
    isScheduled,
    deliveryDateLabel,
    cleanNotes: combinedNotes,
  };
}
