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

const FALLBACK_SCHEDULE: ScheduleEntry[] = [
  // Понедельник
  { id: "mon-1", name: "Йога для начинающих", time: "09:00", endTime: "09:55", trainer: "Наталия Жарикова", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 0, category: "soft" },
  { id: "mon-2", name: "Функциональная тренировка", time: "10:00", endTime: "10:55", trainer: "Екатерина Лазарева", hall: "Большой зал", duration: "55 мин", date: "", dayOfWeek: 0, category: "power" },
  { id: "mon-3", name: "Пилатес", time: "11:00", endTime: "11:55", trainer: "Елена Шарикова", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 0, category: "soft" },
  { id: "mon-4", name: "Сила+", time: "17:00", endTime: "17:55", trainer: "Александр Флотский", hall: "Большой зал", duration: "55 мин", date: "", dayOfWeek: 0, category: "power" },
  { id: "mon-5", name: "Стретчинг", time: "18:00", endTime: "18:55", trainer: "Елена Шарикова", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 0, category: "soft" },
  { id: "mon-6", name: "Огненный велик", time: "19:00", endTime: "19:45", trainer: "Екатерина Лазарева", hall: "Вело-зал", duration: "45 мин", date: "", dayOfWeek: 0, category: "power" },
  // Вторник
  { id: "tue-1", name: "Хатха-йога", time: "09:00", endTime: "10:30", trainer: "Наталия Жарикова", hall: "Средний зал", duration: "90 мин", date: "", dayOfWeek: 1, category: "soft" },
  { id: "tue-2", name: "Интервальная тренировка", time: "10:30", endTime: "11:25", trainer: "Екатерина Лазарева", hall: "Большой зал", duration: "55 мин", date: "", dayOfWeek: 1, category: "power" },
  { id: "tue-3", name: "Здоровая спина", time: "11:30", endTime: "12:25", trainer: "Наталия Жарикова", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 1, category: "soft" },
  { id: "tue-4", name: "Ягодицы ПРО", time: "17:00", endTime: "17:55", trainer: "Екатерина Хлебникова", hall: "Большой зал", duration: "55 мин", date: "", dayOfWeek: 1, category: "power" },
  { id: "tue-5", name: "Леди Стиль", time: "18:00", endTime: "18:55", trainer: "Александр Флотский", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 1, category: "dance" },
  // Среда
  { id: "wed-1", name: "Суставная гимнастика", time: "09:00", endTime: "09:55", trainer: "Эльвина Ларионова", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 2, category: "soft" },
  { id: "wed-2", name: "Рельефное тело", time: "10:00", endTime: "10:55", trainer: "Александр Флотский", hall: "Большой зал", duration: "55 мин", date: "", dayOfWeek: 2, category: "power" },
  { id: "wed-3", name: "Фитнес-мяч", time: "11:00", endTime: "11:55", trainer: "Елена Шарикова", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 2, category: "soft" },
  { id: "wed-4", name: "Функциональная тренировка", time: "17:00", endTime: "17:55", trainer: "Екатерина Лазарева", hall: "Большой зал", duration: "55 мин", date: "", dayOfWeek: 2, category: "power" },
  { id: "wed-5", name: "Стретчинг", time: "18:00", endTime: "18:55", trainer: "Эльвина Ларионова", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 2, category: "soft" },
  // Четверг
  { id: "thu-1", name: "Йога для начинающих", time: "09:00", endTime: "09:55", trainer: "Наталия Жарикова", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 3, category: "soft" },
  { id: "thu-2", name: "Сильные ноги + пресс", time: "10:00", endTime: "10:55", trainer: "Екатерина Хлебникова", hall: "Большой зал", duration: "55 мин", date: "", dayOfWeek: 3, category: "power" },
  { id: "thu-3", name: "Пилатес", time: "11:00", endTime: "11:55", trainer: "Елена Шарикова", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 3, category: "soft" },
  { id: "thu-4", name: "Сила+", time: "17:00", endTime: "17:55", trainer: "Михаил Горбачев", hall: "Большой зал", duration: "55 мин", date: "", dayOfWeek: 3, category: "power" },
  { id: "thu-5", name: "Огненный велик", time: "18:00", endTime: "18:45", trainer: "Екатерина Лазарева", hall: "Вело-зал", duration: "45 мин", date: "", dayOfWeek: 3, category: "power" },
  // Пятница
  { id: "fri-1", name: "Хатха-йога", time: "09:00", endTime: "10:30", trainer: "Наталия Жарикова", hall: "Средний зал", duration: "90 мин", date: "", dayOfWeek: 4, category: "soft" },
  { id: "fri-2", name: "Интервальная тренировка", time: "10:30", endTime: "11:25", trainer: "Екатерина Лазарева", hall: "Большой зал", duration: "55 мин", date: "", dayOfWeek: 4, category: "power" },
  { id: "fri-3", name: "Ягодицы ПРО", time: "17:00", endTime: "17:55", trainer: "Екатерина Лазарева", hall: "Большой зал", duration: "55 мин", date: "", dayOfWeek: 4, category: "power" },
  { id: "fri-4", name: "Суставная гимнастика", time: "18:00", endTime: "18:55", trainer: "Екатерина Хлебникова", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 4, category: "soft" },
  // Суббота
  { id: "sat-1", name: "Йога для начинающих", time: "10:00", endTime: "10:55", trainer: "Наталия Жарикова", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 5, category: "soft" },
  { id: "sat-2", name: "Функциональная тренировка", time: "11:00", endTime: "11:55", trainer: "Александр Флотский", hall: "Большой зал", duration: "55 мин", date: "", dayOfWeek: 5, category: "power" },
  { id: "sat-3", name: "Стретчинг", time: "12:00", endTime: "12:55", trainer: "Елена Шарикова", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 5, category: "soft" },
  // Воскресенье
  { id: "sun-1", name: "Здоровая спина", time: "10:00", endTime: "10:55", trainer: "Наталия Жарикова", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 6, category: "soft" },
  { id: "sun-2", name: "Леди Стиль", time: "11:00", endTime: "11:55", trainer: "Александр Флотский", hall: "Средний зал", duration: "55 мин", date: "", dayOfWeek: 6, category: "dance" },
  { id: "sun-3", name: "Огненный велик", time: "12:00", endTime: "12:45", trainer: "Екатерина Лазарева", hall: "Вело-зал", duration: "45 мин", date: "", dayOfWeek: 6, category: "power" },
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
