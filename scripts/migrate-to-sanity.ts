import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET || 'production';
const apiToken = process.env.SANITY_API_TOKEN;

if (!projectId || !apiToken) {
  console.error('ERROR: SANITY_PROJECT_ID and SANITY_API_TOKEN environment variables must be configured.');
  process.exit(1);
}

const sanityClient = createClient({
  projectId,
  dataset,
  useCdn: false,
  apiVersion: '2023-05-03',
  token: apiToken,
});

const typeMap: Record<string, string> = {
  projects: 'project',
  categories: 'category',
  sections: 'section',
  comments: 'comment',
  inquiries: 'inquiry',
  admin: 'admin',
};

async function migrate() {
  console.log(`Starting migration to Sanity.io (Project ID: ${projectId}, Dataset: ${dataset})...`);

  for (const [collectionName, docType] of Object.entries(typeMap)) {
    const filePath = path.join(__dirname, '..', 'src', `${collectionName}.json`);
    if (!fs.existsSync(filePath)) {
      console.log(`Skipping ${collectionName}: local file not found at ${filePath}`);
      continue;
    }

    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const localData = JSON.parse(raw);

      if (collectionName === 'admin') {
        console.log(`Migrating admin settings...`);
        await sanityClient.createOrReplace({
          _type: 'admin',
          _id: 'admin_settings',
          ...localData,
        });
        console.log(`Migrated admin settings.`);
      } else if (Array.isArray(localData)) {
        if (localData.length === 0) {
          console.log(`Skipping ${collectionName}: local array is empty.`);
          continue;
        }
        console.log(`Migrating ${localData.length} items for ${collectionName}...`);
        const transaction = sanityClient.transaction();
        localData.forEach((item: any) => {
          let id = item.id || item._id;
          if (!id) {
            id = `${docType}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          }
          const docToSave = {
            ...item,
            _type: docType,
            _id: id,
          };
          delete docToSave.id;
          transaction.createOrReplace(docToSave);
        });
        await transaction.commit();
        console.log(`Migrated all ${collectionName} items.`);
      }
    } catch (err: any) {
      console.error(`Error migrating ${collectionName}:`, err.message);
    }
  }

  console.log('Migration to Sanity.io completed successfully!');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
