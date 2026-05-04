import { NextResponse } from "next/server";

// 1C.Fitness lead webhook принимает Tilda-style form-encoded payload.
// Поля: Name, Phone, Email, formid, formname, tranid + произвольные доп.поля.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = String(body.name ?? body.Name ?? "").trim();
    const phone = String(body.phone ?? body.Phone ?? "").trim();
    const email = String(body.email ?? body.Email ?? "").trim();
    const program = String(body.program ?? "").trim();
    const formname = String(body.formname ?? "Лид · arcfit.ru (Vercel)").trim();
    const formid = String(body.formid ?? "next-lead-form").trim();

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Имя и телефон обязательны" },
        { status: 400 }
      );
    }

    const webhookUrl = process.env.FITNESS_LEAD_WEBHOOK;
    if (!webhookUrl) {
      console.error("FITNESS_LEAD_WEBHOOK env is not set");
      return NextResponse.json(
        { error: "Конфигурация формы не задана" },
        { status: 500 }
      );
    }

    const tranid = `arcfit-next-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // 1) form-urlencoded в Tilda-стиле (основной канал)
    const params = new URLSearchParams();
    params.set("Name", name);
    params.set("Phone", phone);
    if (email) params.set("Email", email);
    if (program) params.set("Program", program);
    params.set("formid", formid);
    params.set("formname", formname);
    params.set("tranid", tranid);
    params.set("source", "arcfit-next.vercel.app");

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": "arcfit-next/1.0 (+https://arcfit.ru)",
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("1C.Fitness webhook failed", res.status, text.slice(0, 500));
      return NextResponse.json(
        { error: "Ошибка отправки заявки" },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, tranid });
  } catch (err) {
    console.error("/api/lead exception", err);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
