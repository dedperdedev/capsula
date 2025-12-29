export type EligibilityStatus = 'can' | 'cannot' | 'caution';
export type EligibilityCategory = 'allergies' | 'pregnant' | 'driving' | 'children' | 'diabetics' | 'nursing';

export interface DrugEligibilityItem {
  category: EligibilityCategory;
  status: EligibilityStatus;
  note?: string;
}

export interface DrugCharacteristic {
  key: string;
  value: string;
}

export interface DrugInstruction {
  verifiedText: string;
  officialUrl?: string;
}

export interface DrugReview {
  id: string;
  author: string;
  date: string; // ISO string
  rating: number; // 1-5
  text: string;
}

export interface DrugAnalog {
  id: string;
  name: string;
  meta: string; // form, dosage, pack info
}

export interface DrugRecommendation {
  id: string;
  title: string;
  text: string;
  icon?: string; // Optional icon identifier
}

export interface Drug {
  id: string;
  name: string;
  manufacturer: string;
  form: string;
  packCount: number;
  country?: string;
  atc?: string;
  imageUrl?: string; // URL изображения препарата
  descriptionShort: string;
  descriptionFull: string;
  eligibility: DrugEligibilityItem[];
  characteristics: DrugCharacteristic[];
  instruction: DrugInstruction;
  recommendations?: DrugRecommendation[]; // Рекомендации по применению
  reviewsSummary: {
    avg: number;
    count: number;
  };
  reviews: DrugReview[];
  analogs: DrugAnalog[];
}

