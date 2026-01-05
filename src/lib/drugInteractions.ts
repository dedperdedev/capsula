/**
 * Drug Interactions & Duplicate Active Ingredient Checker
 * Informational only - not medical advice
 */

import { loadAppState } from '../data/storage';

// ============ TYPES ============

export interface DrugInfo {
  id: string;
  name: string;
  activeIngredient?: string; // INN (International Nonproprietary Name)
  atcCode?: string;
}

export interface DuplicateWarning {
  type: 'duplicate_ingredient';
  severity: 'info' | 'warning';
  existingMedication: { id: string; name: string };
  activeIngredient: string;
  message: { ru: string; en: string };
}

export interface InteractionWarning {
  type: 'interaction';
  severity: 'info' | 'warning' | 'critical';
  medications: { id: string; name: string }[];
  interactionType: string;
  message: { ru: string; en: string };
}

export type DrugWarning = DuplicateWarning | InteractionWarning;

// ============ KNOWN ACTIVE INGREDIENTS ============

// Map of common drug names to their active ingredients (INN)
// This is a simplified dataset for demonstration
const KNOWN_INGREDIENTS: Record<string, string> = {
  // Pain relief
  'Темпалгин': 'Metamizole + Triacetonamine',
  'Анальгин': 'Metamizole',
  'Ибупрофен': 'Ibuprofen',
  'Нурофен': 'Ibuprofen',
  'Парацетамол': 'Paracetamol',
  'Панадол': 'Paracetamol',
  'Аспирин': 'Acetylsalicylic acid',
  'Кетанов': 'Ketorolac',
  
  // Cardiovascular
  'Аторвастатин': 'Atorvastatin',
  'Липитор': 'Atorvastatin',
  'Амлодипин': 'Amlodipine',
  'Норваск': 'Amlodipine',
  'Лизиноприл': 'Lisinopril',
  'Диротон': 'Lisinopril',
  
  // Diabetes
  'Метформин': 'Metformin',
  'Глюкофаж': 'Metformin',
  'Глибенкламид': 'Glibenclamide',
  
  // Antibiotics
  'Амоксициллин': 'Amoxicillin',
  'Флемоксин': 'Amoxicillin',
  'Азитромицин': 'Azithromycin',
  'Сумамед': 'Azithromycin',
  
  // GI
  'Омепразол': 'Omeprazole',
  'Омез': 'Omeprazole',
  'Ранитидин': 'Ranitidine',
};

// Known interaction pairs (simplified)
const KNOWN_INTERACTIONS: Array<{
  ingredients: [string, string];
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: { ru: string; en: string };
}> = [
  {
    ingredients: ['Ibuprofen', 'Acetylsalicylic acid'],
    type: 'NSAID_combination',
    severity: 'warning',
    message: {
      ru: 'Совместный прием НПВС увеличивает риск ЖКТ-кровотечения',
      en: 'Combining NSAIDs increases risk of GI bleeding',
    },
  },
  {
    ingredients: ['Metformin', 'Alcohol'],
    type: 'metabolic',
    severity: 'warning',
    message: {
      ru: 'Алкоголь усиливает риск лактоацидоза при приеме метформина',
      en: 'Alcohol increases risk of lactic acidosis with metformin',
    },
  },
  {
    ingredients: ['Warfarin', 'Ibuprofen'],
    type: 'anticoagulant_nsaid',
    severity: 'critical',
    message: {
      ru: 'Значительно повышается риск кровотечения',
      en: 'Significantly increases bleeding risk',
    },
  },
];

// ============ DUPLICATE DETECTION ============

/**
 * Get active ingredient for a drug name (if known)
 */
export function getActiveIngredient(drugName: string): string | null {
  // Try exact match first
  if (KNOWN_INGREDIENTS[drugName]) {
    return KNOWN_INGREDIENTS[drugName];
  }

  // Try case-insensitive match
  const normalizedName = drugName.trim();
  for (const [name, ingredient] of Object.entries(KNOWN_INGREDIENTS)) {
    if (name.toLowerCase() === normalizedName.toLowerCase()) {
      return ingredient;
    }
  }

  return null;
}

/**
 * Check for duplicate active ingredients in user's medication list
 */
export function checkDuplicateIngredients(newDrugName: string): DuplicateWarning | null {
  const newIngredient = getActiveIngredient(newDrugName);
  if (!newIngredient) return null;

  const state = loadAppState();
  
  for (const medication of state.medications) {
    const existingIngredient = getActiveIngredient(medication.name);
    
    if (existingIngredient && ingredientsOverlap(newIngredient, existingIngredient)) {
      return {
        type: 'duplicate_ingredient',
        severity: 'warning',
        existingMedication: { id: medication.id, name: medication.name },
        activeIngredient: newIngredient,
        message: {
          ru: `Возможный дубликат активного вещества (${newIngredient}). Препарат "${medication.name}" уже содержит это вещество. Проконсультируйтесь с врачом.`,
          en: `Possible duplicate active ingredient (${newIngredient}). "${medication.name}" already contains this ingredient. Consult your clinician.`,
        },
      };
    }
  }

  return null;
}

/**
 * Check if two ingredient strings have overlapping components
 */
function ingredientsOverlap(ing1: string, ing2: string): boolean {
  // Handle simple case
  if (ing1 === ing2) return true;

  // Handle combination drugs (e.g., "Metamizole + Triacetonamine")
  const parts1 = ing1.split(/\s*\+\s*/).map(s => s.toLowerCase().trim());
  const parts2 = ing2.split(/\s*\+\s*/).map(s => s.toLowerCase().trim());

  return parts1.some(p1 => parts2.some(p2 => p1 === p2));
}

// ============ INTERACTION DETECTION ============

/**
 * Check for known interactions with user's current medications
 * TODO: Implement full interaction checking with proper database
 */
export function checkInteractions(newDrugName: string): InteractionWarning[] {
  const newIngredient = getActiveIngredient(newDrugName);
  if (!newIngredient) return [];

  const state = loadAppState();
  const warnings: InteractionWarning[] = [];

  for (const medication of state.medications) {
    const existingIngredient = getActiveIngredient(medication.name);
    if (!existingIngredient) continue;

    // Check against known interactions
    for (const interaction of KNOWN_INTERACTIONS) {
      const [ing1, ing2] = interaction.ingredients;
      
      const newMatches = ingredientMatches(newIngredient, ing1) || ingredientMatches(newIngredient, ing2);
      const existingMatches = ingredientMatches(existingIngredient, ing1) || ingredientMatches(existingIngredient, ing2);
      
      if (newMatches && existingMatches && newIngredient !== existingIngredient) {
        warnings.push({
          type: 'interaction',
          severity: interaction.severity,
          medications: [
            { id: 'new', name: newDrugName },
            { id: medication.id, name: medication.name },
          ],
          interactionType: interaction.type,
          message: interaction.message,
        });
      }
    }
  }

  return warnings;
}

function ingredientMatches(ingredient: string, target: string): boolean {
  const parts = ingredient.split(/\s*\+\s*/).map(s => s.toLowerCase().trim());
  return parts.includes(target.toLowerCase());
}

// ============ COMBINED CHECK ============

/**
 * Run all drug safety checks
 */
export function runDrugSafetyChecks(drugName: string): DrugWarning[] {
  const warnings: DrugWarning[] = [];

  const duplicateWarning = checkDuplicateIngredients(drugName);
  if (duplicateWarning) {
    warnings.push(duplicateWarning);
  }

  const interactionWarnings = checkInteractions(drugName);
  warnings.push(...interactionWarnings);

  return warnings;
}

