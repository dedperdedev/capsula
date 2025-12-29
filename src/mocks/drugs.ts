import type { Drug } from '../data/drugTypes';
import { tempalgin } from './tempalgin';

// Моки для аналогов
const analgin: Drug = {
  id: 'analgin',
  name: 'Анальгин табл. №20',
  manufacturer: 'Фармстандарт',
  form: 'Таблетки',
  packCount: 20,
  country: 'Россия',
  imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop&q=80',
  descriptionShort: 'Обезболивающий и жаропонижающий препарат на основе метамизола натрия.',
  descriptionFull: 'Анальгин — обезболивающий и жаропонижающий препарат. Действующее вещество: метамизол натрия. Применяется при болевом синдроме и лихорадке.',
  eligibility: [
    { category: 'allergies', status: 'caution' },
    { category: 'pregnant', status: 'caution' },
    { category: 'driving', status: 'can' },
    { category: 'children', status: 'caution', note: 'С 10 лет' },
    { category: 'diabetics', status: 'can' },
    { category: 'nursing', status: 'caution' }
  ],
  characteristics: [
    { key: 'Действующее вещество', value: 'Метамизол натрия' },
    { key: 'Форма выпуска', value: 'Таблетки' },
    { key: 'Количество в упаковке', value: '20 шт' },
    { key: 'Дозировка', value: '500 мг' }
  ],
  instruction: {
    verifiedText: 'Инструкция проверена 10.01.2024'
  },
  recommendations: [
    {
      id: 'a1',
      title: 'Принимайте с осторожностью',
      text: 'Препарат следует принимать с осторожностью при наличии аллергических реакций.'
    }
  ],
  reviewsSummary: { avg: 4.0, count: 89 },
  reviews: [
    {
      id: 'a1',
      author: 'Иван П.',
      date: '2024-01-12T10:00:00Z',
      rating: 4,
      text: 'Хорошее средство, помогает быстро.'
    }
  ],
  analogs: [
    { id: 'tempalgin', name: 'Темпалгин табл. п/о №20', meta: 'Таблетки, 20 шт' }
  ]
};

const baralgin: Drug = {
  id: 'baralgin',
  name: 'Баралгин табл. №20',
  manufacturer: 'Sanofi',
  form: 'Таблетки',
  packCount: 20,
  country: 'Франция',
  imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop&q=80',
  descriptionShort: 'Комбинированный препарат с обезболивающим действием.',
  descriptionFull: 'Баралгин — комбинированный препарат для снятия болевого синдрома.',
  eligibility: [
    { category: 'allergies', status: 'caution' },
    { category: 'pregnant', status: 'cannot' },
    { category: 'driving', status: 'caution' },
    { category: 'children', status: 'cannot', note: 'С 15 лет' },
    { category: 'diabetics', status: 'can' },
    { category: 'nursing', status: 'cannot' }
  ],
  characteristics: [
    { key: 'Форма выпуска', value: 'Таблетки' },
    { key: 'Количество в упаковке', value: '20 шт' }
  ],
  instruction: {
    verifiedText: 'Инструкция проверена 05.01.2024'
  },
  recommendations: [
    {
      id: 'b1',
      title: 'Соблюдайте дозировку',
      text: 'Не превышайте рекомендованную дозировку. При появлении побочных эффектов прекратите прием.'
    }
  ],
  reviewsSummary: { avg: 4.1, count: 56 },
  reviews: [],
  analogs: [
    { id: 'tempalgin', name: 'Темпалгин табл. п/о №20', meta: 'Таблетки, 20 шт' }
  ]
};

const pentalgin: Drug = {
  id: 'pentalgin',
  name: 'Пенталгин табл. №12',
  manufacturer: 'Фармстандарт',
  form: 'Таблетки',
  packCount: 12,
  country: 'Россия',
  imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop&q=80',
  descriptionShort: 'Комбинированный препарат с обезболивающим действием.',
  descriptionFull: 'Пенталгин — комбинированный препарат для снятия болевого синдрома.',
  eligibility: [
    { category: 'allergies', status: 'caution' },
    { category: 'pregnant', status: 'cannot' },
    { category: 'driving', status: 'caution' },
    { category: 'children', status: 'cannot', note: 'С 18 лет' },
    { category: 'diabetics', status: 'caution' },
    { category: 'nursing', status: 'cannot' }
  ],
  characteristics: [
    { key: 'Форма выпуска', value: 'Таблетки' },
    { key: 'Количество в упаковке', value: '12 шт' }
  ],
  instruction: {
    verifiedText: 'Инструкция проверена 20.12.2023'
  },
  recommendations: [
    {
      id: 'p1',
      title: 'Храните правильно',
      text: 'Храните препарат в сухом месте при комнатной температуре, вдали от прямых солнечных лучей.'
    }
  ],
  reviewsSummary: { avg: 4.3, count: 203 },
  reviews: [],
  analogs: [
    { id: 'tempalgin', name: 'Темпалгин табл. п/о №20', meta: 'Таблетки, 20 шт' }
  ]
};

const spazmalgon: Drug = {
  id: 'spazmalgon',
  name: 'Спазмалгон табл. №20',
  manufacturer: 'Sopharma',
  form: 'Таблетки',
  packCount: 20,
  country: 'Болгария',
  imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop&q=80',
  descriptionShort: 'Комбинированный препарат с обезболивающим и спазмолитическим действием.',
  descriptionFull: 'Спазмалгон — комбинированный препарат для снятия болевого синдрома и спазмов.',
  eligibility: [
    { category: 'allergies', status: 'caution' },
    { category: 'pregnant', status: 'caution' },
    { category: 'driving', status: 'caution' },
    { category: 'children', status: 'cannot', note: 'С 15 лет' },
    { category: 'diabetics', status: 'can' },
    { category: 'nursing', status: 'caution' }
  ],
  characteristics: [
    { key: 'Форма выпуска', value: 'Таблетки' },
    { key: 'Количество в упаковке', value: '20 шт' }
  ],
  instruction: {
    verifiedText: 'Инструкция проверена 15.12.2023'
  },
  recommendations: [
    {
      id: 's1',
      title: 'Проконсультируйтесь с врачом',
      text: 'Перед применением проконсультируйтесь с врачом, особенно при наличии хронических заболеваний.'
    }
  ],
  reviewsSummary: { avg: 4.0, count: 145 },
  reviews: [],
  analogs: [
    { id: 'tempalgin', name: 'Темпалгин табл. п/о №20', meta: 'Таблетки, 20 шт' }
  ]
};

export const DRUGS: Drug[] = [
  tempalgin,
  analgin,
  baralgin,
  pentalgin,
  spazmalgon
];

export function getDrugById(id: string): Drug | undefined {
  return DRUGS.find(drug => drug.id === id);
}

export function searchDrugs(query: string): Drug[] {
  if (!query.trim()) {
    // При пустом запросе возвращаем популярные (включая Темпалгин)
    return [tempalgin, pentalgin, baralgin, analgin].slice(0, 6);
  }

  const lowerQuery = query.toLowerCase();
  const results = DRUGS.filter(drug => {
    return (
      drug.name.toLowerCase().includes(lowerQuery) ||
      drug.manufacturer.toLowerCase().includes(lowerQuery) ||
      drug.form.toLowerCase().includes(lowerQuery)
    );
  });

  // Сортировка: сначала те, что начинаются с запроса
  results.sort((a, b) => {
    const aStarts = a.name.toLowerCase().startsWith(lowerQuery);
    const bStarts = b.name.toLowerCase().startsWith(lowerQuery);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return 0;
  });

  return results.slice(0, 8);
}

