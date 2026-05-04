import { NextResponse } from "next/server";
import { PROGRAMS, TRAINERS } from "@/lib/constants";

export interface ScheduleEntry {
  id: string;
  name: string;
  time: string;
  endTime: string;
  trainer: string;
  hall: string;
  duration: string;
  date: string;
  dayOfWeek: number; // 0=Пн, 1=Вт, ..., 6=Вс
  category: "power" | "soft" | "dance";
}

const HALLS = ["Средний зал", "Большой зал", "Вело-зал"];

// Источник: PDF «Расписание 4 мая – 10 мая 2026», Арктика Фитнес, Зелёный пер. 10
const FALLBACK_SCHEDULE: ScheduleEntry[] = [
  // Понедельник
  { id: "mon-1", name: "Сила+", time: "09:00", endTime: "09:55", trainer: "Екатерина Лазарева", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 0, category: "power" },
  { id: "mon-2", name: "Здоровая спина", time: "10:00", endTime: "10:55", trainer: "Екатерина Лазарева", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 0, category: "soft" },
  { id: "mon-3", name: "Сила+", time: "19:00", endTime: "19:55", trainer: "Екатерина Лазарева", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 0, category: "power" },
  { id: "mon-4", name: "Здоровая спина", time: "20:00", endTime: "20:55", trainer: "Екатерина Лазарева", hall: "Большой зал", duration: "55 мин", date: "", dayOfWeek: 0, category: "soft" },
  { id: "mon-5", name: "Функциональная тренировка", time: "20:00", endTime: "20:55", trainer: "Елена Сергеева", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 0, category: "power" },
  // Вторник
  { id: "tue-1", name: "Руки + пресс", time: "09:00", endTime: "09:55", trainer: "Екатерина Лазарева", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 1, category: "power" },
  { id: "tue-2", name: "Йога для начинающих", time: "10:30", endTime: "11:25", trainer: "Елена Шарикова", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 1, category: "soft" },
  { id: "tue-3", name: "Пилатес", time: "19:00", endTime: "19:55", trainer: "Елена Шарикова", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 1, category: "soft" },
  { id: "tue-4", name: "Хатха-йога", time: "20:00", endTime: "21:30", trainer: "Елена Шарикова", hall: "Средний зал", duration: "90 мин", date: "", dayOfWeek: 1, category: "soft" },
  // Среда
  { id: "wed-1", name: "Ягодицы ПРО", time: "09:00", endTime: "09:55", trainer: "Екатерина Лазарева", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 2, category: "power" },
  { id: "wed-2", name: "Мобилити", time: "10:00", endTime: "10:55", trainer: "Екатерина Лазарева", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 2, category: "soft" },
  { id: "wed-3", name: "Интервальная тренировка", time: "19:00", endTime: "19:55", trainer: "Екатерина Лазарева", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 2, category: "power" },
  { id: "wed-4", name: "Огненный велик", time: "20:00", endTime: "20:55", trainer: "Елена Сергеева", hall: "Вело-зал", duration: "55 мин", date: "", dayOfWeek: 2, category: "power" },
  { id: "wed-5", name: "Леди Стиль", time: "20:15", endTime: "21:10", trainer: "Екатерина Лазарева", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 2, category: "dance" },
  // Четверг
  { id: "thu-1", name: "Пилатес", time: "09:00", endTime: "09:55", trainer: "Эльвина Ларионова", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 3, category: "soft" },
  { id: "thu-2", name: "Стретчинг", time: "10:00", endTime: "10:55", trainer: "Эльвина Ларионова", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 3, category: "soft" },
  { id: "thu-3", name: "Рельефное тело", time: "19:00", endTime: "19:55", trainer: "Александр Флотский", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 3, category: "power" },
  { id: "thu-4", name: "Хатха-йога", time: "19:00", endTime: "20:30", trainer: "Елена Шарикова", hall: "Большой зал", duration: "90 мин", date: "", dayOfWeek: 3, category: "soft" },
  // Пятница
  { id: "fri-1", name: "Фитнес Микс", time: "09:00", endTime: "09:55", trainer: "Екатерина Хлебникова", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 4, category: "power" },
  { id: "fri-2", name: "Суставная гимнастика", time: "10:00", endTime: "10:55", trainer: "Екатерина Хлебникова", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 4, category: "soft" },
  { id: "fri-3", name: "Суставная гимнастика", time: "19:00", endTime: "19:55", trainer: "Эльвина Ларионова", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 4, category: "soft" },
  { id: "fri-4", name: "Функциональная тренировка", time: "20:00", endTime: "20:55", trainer: "Елена Сергеева", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 4, category: "power" },
  // Суббота — выходной
  // Воскресенье
  { id: "sun-1", name: "Огненный велик", time: "12:00", endTime: "12:55", trainer: "Елена Сергеева", hall: "Вело-зал", duration: "55 мин", date: "", dayOfWeek: 6, category: "power" },
  { id: "sun-2", name: "Рельефное тело", time: "15:15", endTime: "16:10", trainer: "Александр Флотский", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 6, category: "power" },
];

export async function GET() {
  try {
    const apiUrl = process.env.FITNESS_API_URL;
    const appKey = process.env.FITNESS_APP_KEY;
    const secretKey = process.env.FITNESS_SECRET_KEY;

    if (!apiUrl || !appKey || !secretKey) {
      return NextResponse.json(FALLBACK_SCHEDULE);
    }

    const res = await fetch(`${apiUrl}/getCourtSchedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ APP_KEY: appKey, SECRET_KEY: secretKey }),
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json(FALLBACK_SCHEDULE);
    }

    const data = await res.json();

    if (Array.isArray(data) && data.length > 0) {
      return NextResponse.json(data);
    }

    return NextResponse.json(FALLBACK_SCHEDULE);
  } catch {
    return NextResponse.json(FALLBACK_SCHEDULE);
  }
}
