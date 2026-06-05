import { closeDatabase, seedKnowledgeBase } from '../services/database.js';

const result = await seedKnowledgeBase();
console.log(`Seeded ${result.seeded} knowledge records using ${result.mode} mode.`);

await closeDatabase();
