const API_URL = process.env.FITNESS_API_URL!;
const APP_KEY = process.env.FITNESS_APP_KEY!;
const SECRET_KEY = process.env.FITNESS_SECRET_KEY!;
const LEAD_WEBHOOK = process.env.FITNESS_LEAD_WEBHOOK!;

export async function fetchSchedule() {
  try {
    const res = await fetch(`${API_URL}/getCourtSchedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ APP_KEY, SECRET_KEY }),
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch schedule:", error);
    return null;
  }
}

export async function fetchCoaches() {
  try {
    const res = await fetch(`${API_URL}/getPersonalCoaches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ APP_KEY, SECRET_KEY }),
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch coaches:", error);
    return null;
  }
}

export async function submitLead(data: { name: string; phone: string }) {
  const res = await fetch(LEAD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Lead webhook error: ${res.status}`);
  return res.json();
}
