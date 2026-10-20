import { HabitDefinition } from '../types/habit';

export const DEFAULT_HABITS: HabitDefinition[] = [
  {
    id: 'habit-balanced-meals',
    title: 'Eat Balanced Meals',
    description: 'Include complex carbohydrates, dietary fiber, lean protein, and healthy fats.',
    category: 'nutrition',
    icon: 'Utensils'
  },
  {
    id: 'habit-protein-rich',
    title: 'Eat a Protein-Rich Food',
    description: 'Incorporate dal, paneer, eggs, chicken, fish, sprouts, or soya.',
    category: 'nutrition',
    icon: 'Egg'
  },
  {
    id: 'habit-fruits-veggies',
    title: 'Eat Fruits / Vegetables',
    description: 'Have at least 2 servings of fresh seasonal fruits or vegetables.',
    category: 'nutrition',
    icon: 'Apple'
  },
  {
    id: 'habit-drink-water',
    title: 'Drink Water Regularly',
    description: 'Stay consistently hydrated with 2 - 3 liters of water or chaas/coconut water.',
    category: 'hydration',
    icon: 'Droplets'
  },
  {
    id: 'habit-physical-activity',
    title: 'Physical Activity (30+ mins)',
    description: 'Brisk walking, yoga, gym workout, sport, or cycling.',
    category: 'activity',
    icon: 'Footprints'
  },
  {
    id: 'habit-adequate-sleep',
    title: 'Adequate Sleep (7-8 hours)',
    description: 'Prioritize restorative restful sleep for body and brain recovery.',
    category: 'lifestyle',
    icon: 'Moon'
  },
  {
    id: 'habit-limit-screen',
    title: 'Limit Excessive Screen Time',
    description: 'Take mindful digital breaks, especially 1 hour before sleeping.',
    category: 'lifestyle',
    icon: 'Smartphone'
  },
  {
    id: 'habit-track-meals',
    title: 'Track Daily Meals',
    description: 'Mindfully log breakfast, lunch, snacks, and dinner on NutriTrack.',
    category: 'nutrition',
    icon: 'ClipboardCheck'
  }
];
