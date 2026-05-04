// ============================================================
// Данные фитнес-студии Арктика — единый источник истины
// ============================================================

export const SITE = {
  name: "Фитнес-студия Арктика",
  url: "https://arcfit.ru",
  address: "г. Видное, Зелёный пер., 10",
  addressFull:
    "Московская область, Ленинский район, г. Видное, Зелёный переулок, 10",
  phone: "+7 925 088 9196",
  phoneSales: "+7 936 142 3841",
  telegram: "https://t.me/arcfit",
  hours: "7:00–22:00",
  geo: { lat: 55.561548, lng: 37.712605 },
  description:
    "Фитнес-студия в спортивном комплексе Арктика, г. Видное. 20+ направлений, 9 тренеров, тренажёрный зал.",
} as const;

export type ProgramCategory = "power" | "soft" | "dance";

export interface Program {
  slug: string;
  name: string;
  category: ProgramCategory;
  shortDescription: string;
  duration: string;
  intensity: "низкая" | "средняя" | "высокая";
  trainers: string[]; // slugs тренеров
  metaTitle: string;
  metaDescription: string;
}

export const PROGRAMS: Program[] = [
  {
    slug: "yoga",
    name: "Йога для начинающих",
    category: "soft",
    shortDescription:
      "Мягкая практика для новичков. Базовые асаны, дыхание, расслабление.",
    duration: "55 минут",
    intensity: "низкая",
    trainers: ["zharikova"],
    metaTitle: "Йога в Видном — занятия для начинающих | Арктика Фитнес",
    metaDescription:
      "Занятия йогой в Видном для начинающих и продвинутых. Опытные инструкторы. Фитнес-студия Арктика.",
  },
  {
    slug: "hatha-yoga",
    name: "Хатха-йога",
    category: "soft",
    shortDescription:
      "Классическая йога: асаны, пранаяма, медитация. Для любого уровня.",
    duration: "90 минут",
    intensity: "средняя",
    trainers: ["zharikova", "sharikova"],
    metaTitle: "Хатха-йога в Видном | Арктика Фитнес",
    metaDescription:
      "Хатха-йога в Видном — 90-минутные занятия для тела и ума. Фитнес-студия Арктика.",
  },
  {
    slug: "stretching",
    name: "Стретчинг",
    category: "soft",
    shortDescription:
      "Упражнения на растяжку для гибкости и здоровья суставов.",
    duration: "55 минут",
    intensity: "низкая",
    trainers: ["larionova"],
    metaTitle: "Стретчинг в Видном — занятия растяжкой | Арктика Фитнес",
    metaDescription:
      "Стретчинг в Видном — растяжка для всех уровней. Гибкость и здоровье. Фитнес-студия Арктика.",
  },
  {
    slug: "pilates",
    name: "Пилатес",
    category: "soft",
    shortDescription:
      "Система упражнений для укрепления мышц кора, осанки и баланса.",
    duration: "55 минут",
    intensity: "средняя",
    trainers: ["sharikova"],
    metaTitle: "Пилатес в Видном | Арктика Фитнес",
    metaDescription:
      "Пилатес в Видном — укрепление кора, осанки и баланса. Фитнес-студия Арктика.",
  },
  {
    slug: "fitball",
    name: "Фитнес-мяч",
    category: "soft",
    shortDescription:
      "Тренировка с фитболом для силы, гибкости и координации.",
    duration: "55 минут",
    intensity: "средняя",
    trainers: ["sharikova"],
    metaTitle: "Фитнес-мяч (фитбол) в Видном | Арктика Фитнес",
    metaDescription:
      "Фитбол-тренировки в Видном — сила, гибкость, координация. Фитнес-студия Арктика.",
  },
  {
    slug: "back-health",
    name: "Здоровая спина",
    category: "soft",
    shortDescription:
      "Упражнения для укрепления спины и профилактики болей.",
    duration: "55 минут",
    intensity: "низкая",
    trainers: ["lazareva"],
    metaTitle: "Здоровая спина в Видном | Арктика Фитнес",
    metaDescription:
      "Занятия для здоровой спины в Видном — профилактика болей, укрепление мышц. Арктика Фитнес.",
  },
  {
    slug: "mobility",
    name: "Суставная гимнастика",
    category: "soft",
    shortDescription:
      "Мягкая работа с суставами для подвижности и профилактики.",
    duration: "55 минут",
    intensity: "низкая",
    trainers: ["larionova", "khlebnikova"],
    metaTitle: "Суставная гимнастика в Видном | Арктика Фитнес",
    metaDescription:
      "Суставная гимнастика и мобилити в Видном — здоровые суставы в любом возрасте. Арктика Фитнес.",
  },
  {
    slug: "functional",
    name: "Функциональная тренировка",
    category: "power",
    shortDescription:
      "Комплексная тренировка на все группы мышц. Средний и высокий уровень, не для новичков.",
    duration: "55 минут",
    intensity: "высокая",
    trainers: ["sergeeva"],
    metaTitle:
      "Функциональная тренировка в Видном | Арктика Фитнес",
    metaDescription:
      "Функциональный тренинг в Видном — сила и выносливость. Фитнес-студия Арктика.",
  },
  {
    slug: "interval",
    name: "Интервальная тренировка",
    category: "power",
    shortDescription:
      "Чередование аэробных и силовых упражнений. Идеально для снижения веса.",
    duration: "55 минут",
    intensity: "высокая",
    trainers: ["lazareva"],
    metaTitle: "Интервальная тренировка в Видном | Арктика Фитнес",
    metaDescription:
      "Интервальные тренировки в Видном — эффективное жиросжигание. Фитнес-студия Арктика.",
  },
  {
    slug: "power-plus",
    name: "Сила+",
    category: "power",
    shortDescription:
      "Силовая тренировка для всех групп мышц с отягощениями.",
    duration: "55 минут",
    intensity: "высокая",
    trainers: ["lazareva"],
    metaTitle: "Сила+ — силовая тренировка в Видном | Арктика Фитнес",
    metaDescription:
      "Силовые тренировки в Видном — набор массы и рельеф. Фитнес-студия Арктика.",
  },
  {
    slug: "fitness-mix",
    name: "Фитнес Микс",
    category: "power",
    shortDescription:
      "Кардио, силовая и стретчинг в одной тренировке. Все мышцы за 55 минут.",
    duration: "55 минут",
    intensity: "средняя",
    trainers: ["khlebnikova"],
    metaTitle: "Фитнес Микс в Видном | Арктика Фитнес",
    metaDescription:
      "Фитнес Микс в Видном — кардио + силовая + стретчинг. Фитнес-студия Арктика.",
  },
  {
    slug: "glutes",
    name: "Ягодицы ПРО",
    category: "power",
    shortDescription:
      "Специализированная тренировка для ягодичных мышц.",
    duration: "55 минут",
    intensity: "средняя",
    trainers: ["lazareva"],
    metaTitle: "Ягодицы ПРО в Видном | Арктика Фитнес",
    metaDescription:
      "Тренировка ягодиц в Видном — подтянутые формы. Фитнес-студия Арктика.",
  },
  {
    slug: "body-sculpt",
    name: "Рельефное тело",
    category: "power",
    shortDescription:
      "Комплексная силовая тренировка для формирования рельефа.",
    duration: "55 минут",
    intensity: "высокая",
    trainers: ["flotskiy"],
    metaTitle: "Рельефное тело в Видном | Арктика Фитнес",
    metaDescription:
      "Тренировка для рельефного тела в Видном. Фитнес-студия Арктика.",
  },
  {
    slug: "cycling",
    name: "Огненный велик",
    category: "power",
    shortDescription:
      "Интенсивная кардио-тренировка на велотренажёрах под музыку.",
    duration: "45 минут",
    intensity: "высокая",
    trainers: ["sergeeva"],
    metaTitle: "Сайкл-тренировки в Видном | Арктика Фитнес",
    metaDescription:
      "Сайкл (велотренажёр) в Видном — кардио под музыку. Фитнес-студия Арктика.",
  },
  {
    slug: "lady-style",
    name: "Леди Стиль",
    category: "dance",
    shortDescription:
      "Танцевальное направление для женщин. Грация, пластика, уверенность.",
    duration: "55 минут",
    intensity: "средняя",
    trainers: ["lazareva"],
    metaTitle: "Леди Стиль — танцы в Видном | Арктика Фитнес",
    metaDescription:
      "Танцы Леди Стиль в Видном — грация и пластика. Фитнес-студия Арктика.",
  },
];

export interface Trainer {
  slug: string;
  name: string;
  role: string;
  specializations: string[];
  programs: string[]; // slugs программ
  bio?: string;
  experience?: string;
  metaTitle: string;
  metaDescription: string;
}

export const TRAINERS: Trainer[] = [
  {
    slug: "lazareva",
    name: "Екатерина Лазарева",
    role: "Инструктор групповых программ. Персональный тренер.",
    specializations: ["Групповые программы", "Персональные тренировки"],
    programs: ["back-health", "power-plus", "glutes", "interval", "lady-style"],
    metaTitle:
      "Екатерина Лазарева — тренер | Арктика Фитнес, Видное",
    metaDescription:
      "Екатерина Лазарева — инструктор групповых программ и персональный тренер в фитнес-студии Арктика, Видное.",
  },
  {
    slug: "flotskiy",
    name: "Александр Флотский",
    role: "Инструктор тренажёрного зала. Персональный тренер. Преподаватель сальсы.",
    specializations: [
      "Тренажёрный зал",
      "Персональные тренировки",
      "Сальса",
    ],
    programs: ["body-sculpt"],
    metaTitle:
      "Александр Флотский — тренер | Арктика Фитнес, Видное",
    metaDescription:
      "Александр Флотский — инструктор тренажёрного зала и персональный тренер в фитнес-студии Арктика, Видное.",
  },
  {
    slug: "gorbachev",
    name: "Михаил Горбачев",
    role: "Инструктор тренажёрного зала. Персональный тренер.",
    specializations: ["Тренажёрный зал", "Персональные тренировки"],
    programs: [],
    metaTitle:
      "Михаил Горбачев — тренер | Арктика Фитнес, Видное",
    metaDescription:
      "Михаил Горбачев — инструктор тренажёрного зала в фитнес-студии Арктика, Видное.",
  },
  {
    slug: "chokaev",
    name: "Умар Чокаев",
    role: "Тренер по единоборствам. Персональный тренер.",
    specializations: ["Единоборства", "Персональные тренировки"],
    programs: [],
    metaTitle: "Умар Чокаев — тренер | Арктика Фитнес, Видное",
    metaDescription:
      "Умар Чокаев — тренер по единоборствам в фитнес-студии Арктика, Видное.",
  },
  {
    slug: "zharikova",
    name: "Наталия Жарикова",
    role: "Инструктор групповых программ. Инструктор по йоге.",
    specializations: ["Йога", "Групповые программы"],
    programs: ["yoga", "hatha-yoga"],
    metaTitle:
      "Наталия Жарикова — тренер по йоге | Арктика Фитнес, Видное",
    metaDescription:
      "Наталия Жарикова — инструктор по йоге в фитнес-студии Арктика, Видное.",
  },
  {
    slug: "sharikova",
    name: "Елена Шарикова",
    role: "Инструктор групповых программ. Тренер тренажёрного зала.",
    specializations: ["Групповые программы", "Тренажёрный зал"],
    programs: ["hatha-yoga", "pilates", "fitball"],
    metaTitle:
      "Елена Шарикова — тренер | Арктика Фитнес, Видное",
    metaDescription:
      "Елена Шарикова — инструктор групповых программ в фитнес-студии Арктика, Видное.",
  },
  {
    slug: "khlebnikova",
    name: "Екатерина Хлебтикова",
    role: "Тренер групповых программ. Организатор спортивных мероприятий.",
    specializations: [
      "Групповые программы",
      "Спортивные мероприятия",
    ],
    programs: ["fitness-mix", "mobility"],
    metaTitle:
      "Екатерина Хлебтикова — тренер | Арктика Фитнес, Видное",
    metaDescription:
      "Екатерина Хлебтикова — тренер групповых программ в фитнес-студии Арктика, Видное.",
  },
  {
    slug: "sergeeva",
    name: "Елена Сергеева",
    role: "Инструктор тренажёрного зала. Персональный тренер.",
    specializations: ["Тренажёрный зал", "Персональные тренировки"],
    programs: ["functional", "cycling"],
    metaTitle:
      "Елена Сергеева — тренер | Арктика Фитнес, Видное",
    metaDescription:
      "Елена Сергеева — инструктор тренажёрного зала в фитнес-студии Арктика, Видное.",
  },
  {
    slug: "larionova",
    name: "Эльвина Ларионова",
    role: "Тренер групповых программ.",
    specializations: ["Групповые программы"],
    programs: ["stretching", "mobility"],
    metaTitle:
      "Эльвина Ларионова — тренер | Арктика Фитнес, Видное",
    metaDescription:
      "Эльвина Ларионова — тренер групповых программ в фитнес-студии Арктика, Видное.",
  },
];

export interface Facility {
  slug: string;
  name: string;
  description: string;
  features: string[];
  metaTitle: string;
  metaDescription: string;
}

export const FACILITIES: Facility[] = [
  {
    slug: "gym",
    name: "Тренажёрный зал",
    description:
      "Современные силовые тренажёры, свободные веса, кардиозона. Всё для эффективных тренировок.",
    features: [
      "Силовые тренажёры",
      "Свободные веса",
      "Кардиотренажёры",
      "Зеркала",
    ],
    metaTitle:
      "Тренажёрный зал в Видном | Арктика Фитнес",
    metaDescription:
      "Тренажёрный зал в Видном — силовые тренажёры, свободные веса, кардио. Фитнес-студия Арктика.",
  },
  {
    slug: "small-hall",
    name: "Малый зал групповых программ",
    description:
      "Камерный зал для занятий в небольших группах. Идеален для йоги и стретчинга.",
    features: ["Коврики", "Зеркала", "Кондиционер"],
    metaTitle: "Малый зал | Арктика Фитнес, Видное",
    metaDescription:
      "Малый зал для групповых занятий — йога, стретчинг. Фитнес-студия Арктика, Видное.",
  },
  {
    slug: "medium-hall",
    name: "Средний зал групповых программ",
    description:
      "Основной зал для групповых программ. Просторный, с хорошей вентиляцией.",
    features: [
      "Коврики",
      "Гантели",
      "Степ-платформы",
      "Зеркала",
      "Звуковая система",
    ],
    metaTitle: "Средний зал | Арктика Фитнес, Видное",
    metaDescription:
      "Средний зал для групповых занятий — основной зал фитнес-студии Арктика, Видное.",
  },
  {
    slug: "large-hall",
    name: "Большой зал групповых программ",
    description:
      "Самый большой зал комплекса для масштабных групповых тренировок.",
    features: [
      "Большая площадь",
      "Зеркала",
      "Оборудование",
      "Звуковая система",
    ],
    metaTitle: "Большой зал | Арктика Фитнес, Видное",
    metaDescription:
      "Большой зал для групповых программ в фитнес-студии Арктика, Видное.",
  },
  {
    slug: "cardio",
    name: "Кардиозона",
    description:
      "Беговые дорожки, эллиптические тренажёры, велотренажёры.",
    features: [
      "Беговые дорожки",
      "Эллипсоиды",
      "Велотренажёры",
    ],
    metaTitle: "Кардиозона в Видном | Арктика Фитнес",
    metaDescription:
      "Кардиозона — беговые дорожки, эллипсоиды, велотренажёры. Фитнес-студия Арктика, Видное.",
  },
  {
    slug: "cycling-hall",
    name: "Вело-зал",
    description:
      "Специализированный зал для сайкл-тренировок «Огненный велик».",
    features: [
      "Сайкл-тренажёры",
      "Звуковая система",
      "Подсветка",
    ],
    metaTitle: "Вело-зал (сайкл) в Видном | Арктика Фитнес",
    metaDescription:
      "Вело-зал для сайкл-тренировок в фитнес-студии Арктика, Видное.",
  },
];

export const NAV_LINKS = [
  { href: "/programs", label: "Направления" },
  { href: "/schedule", label: "Расписание" },
  { href: "/trainers", label: "Тренеры" },
  { href: "/pricing", label: "Цены" },
  { href: "/facilities", label: "Зоны клуба" },
  { href: "/blog", label: "Блог" },
  { href: "/contacts", label: "Контакты" },
] as const;

export const CATEGORY_LABELS: Record<ProgramCategory, string> = {
  power: "Силовые",
  soft: "Мягкий фитнес",
  dance: "Танцы",
};
