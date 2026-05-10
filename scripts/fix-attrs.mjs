import { Client, Databases } from "node-appwrite";

const PROJECT_ID = "690752f9003a03ba4d8f";
const API_KEY =
  "standard_a2d2d623b8fec41f726139d4cf1b215556dff9c1c229f8b22530c364b5147725d1befe533b7ee47c552cd1b4c3a58f910a37ebfb0de9cf29a966feb8b0aab0c191e6fe8a907364703cc5311b4d38c8bf73f97d0a6582fa666f0d9db86acf5915de3ccb83f71936d59e053db9317333aae71f50dfeff1ecfdf31d790bbf7dc4ae";
const DATABASE_ID = "6907531300115da60a9e";

const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const db = new Databases(client);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fixAttr(collectionId, key, size = 255) {
  // delete
  try {
    await db.deleteAttribute(DATABASE_ID, collectionId, key);
    console.log(`  deleted ${key}`);
    await sleep(1500); // Appwrite needs a moment to process
  } catch (e) {
    console.log(`  could not delete ${key}: ${e.message}`);
  }

  // recreate
  try {
    await db.createStringAttribute(DATABASE_ID, collectionId, key, size, true);
    console.log(`  ✓ recreated ${key} (size=${size})`);
  } catch (e) {
    console.error(`  ✗ failed to recreate ${key}: ${e.message}`);
  }
}

async function main() {
  console.log("Fixing users collection attributes...");
  await fixAttr("users", "email", 255);
  await fixAttr("users", "userId", 255);

  console.log("\nDone.");
}

main().catch(console.error);
