import { KnowledgeRecord } from '../types/domain.js';

export const knowledgeBase: KnowledgeRecord[] = [
  {
    id: 'wheat-yellow-rust',
    crop: 'wheat',
    category: 'DISEASE',
    title: 'Possible yellow rust',
    keywords: ['yellow', 'rust', 'stripe', 'streak', 'leaf', 'patch'],
    response: 'Yellow rust is likely when wheat leaves show yellow-orange streaks or patchy yellowing, especially in cool and humid conditions.',
    symptoms: ['Yellow-orange streaks on leaves', 'Patchy yellowing in the field', 'Reduced leaf vigor'],
    confidence: 0.78,
    actionItems: [
      'Scout nearby plots and compare symptom spread.',
      'Avoid excess irrigation while symptoms are active.',
      'Confirm fungicide choice and dosage with a local extension officer.',
    ],
  },
  {
    id: 'wheat-leaf-rust',
    crop: 'wheat',
    category: 'DISEASE',
    title: 'Possible leaf rust',
    keywords: ['brown', 'orange', 'rust', 'pustule', 'spot'],
    response: 'Leaf rust may be present when small orange-brown pustules appear scattered across wheat leaves.',
    symptoms: ['Orange-brown pustules', 'Scattered spots on leaves', 'Premature leaf drying'],
    confidence: 0.72,
    actionItems: [
      'Check lower and middle leaves for rust pustules.',
      'Reduce crop stress with balanced irrigation.',
      'Seek local fungicide guidance if rust is spreading quickly.',
    ],
  },
  {
    id: 'wheat-yield-fertilizer',
    crop: 'wheat',
    category: 'YIELD_ADVICE',
    title: 'Balanced fertilizer for wheat yield',
    keywords: ['fertilizer', 'yield', 'urea', 'dap', 'increase', 'production'],
    response: 'Wheat yield improves when nitrogen and phosphorus are applied in balanced, split doses and matched to crop stage and soil condition.',
    actionItems: [
      'Use split nitrogen doses rather than one heavy application.',
      'Protect crown root initiation and grain filling from water stress.',
      'Scout weekly for rust, aphids, yellowing, and lodging risk.',
    ],
  },
  {
    id: 'wheat-irrigation-layout',
    crop: 'wheat',
    category: 'FARM_PLANNING',
    title: 'Block-based irrigation layout',
    keywords: ['plan', 'layout', 'kanal', 'irrigation', 'divide', 'water', 'section', 'plot'],
    response: 'Block-based planning keeps wheat irrigation easier to control and makes disease scouting more efficient.',
    actionItems: [
      'Divide the field into 3-4 irrigation blocks.',
      'Keep a narrow service path for crop inspection.',
      'Match watering frequency to soil moisture and crop stage.',
    ],
  },
  {
    id: 'wheat-general-management',
    crop: 'wheat',
    category: 'GENERAL_AGRICULTURE',
    title: 'General wheat crop management',
    keywords: ['wheat', 'crop', 'manage', 'sowing', 'seed', 'field'],
    response: 'Strong wheat management starts with clean seed, timely sowing, balanced nutrients, weed control, and quick response to visible symptoms.',
    actionItems: [
      'Keep farm profile details updated.',
      'Add crop stage and field conditions when asking for advice.',
      'Upload a clear crop image when symptoms are visible.',
    ],
  },
];
