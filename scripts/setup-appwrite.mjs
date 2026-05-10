import { Client, Databases, Permission, Role } from "node-appwrite";

const PROJECT_ID = "690752f9003a03ba4d8f";
const API_KEY =
  "standard_a2d2d623b8fec41f726139d4cf1b215556dff9c1c229f8b22530c364b5147725d1befe533b7ee47c552cd1b4c3a58f910a37ebfb0de9cf29a966feb8b0aab0c191e6fe8a907364703cc5311b4d38c8bf73f97d0a6582fa666f0d9db86acf5915de3ccb83f71936d59e053db9317333aae71f50dfeff1ecfdf31d790bbf7dc4ae";
const DATABASE_ID = "6907531300115da60a9e";

const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const db = new Databases(client);

const permissions = [
  Permission.read(Role.any()),
  Permission.create(Role.users()),
  Permission.update(Role.users()),
  Permission.delete(Role.users()),
];

async function createAttr(type, collectionId, key, opts = {}) {
  try {
    if (type === "string") {
      await db.createStringAttribute(DATABASE_ID, collectionId, key, opts.size ?? 255, opts.required ?? true, opts.default ?? null, opts.array ?? false);
    } else if (type === "float") {
      await db.createFloatAttribute(DATABASE_ID, collectionId, key, opts.required ?? true);
    }
    console.log(`  ✓ ${key}`);
  } catch (e) {
    if (e.code === 409) {
      console.log(`  ~ ${key} (already exists)`);
    } else {
      console.error(`  ✗ ${key}:`, e.message);
    }
  }
}

async function createCollection(id, name) {
  try {
    await db.createCollection(DATABASE_ID, id, name, permissions);
    console.log(`\nCreated collection: ${name} (${id})`);
  } catch (e) {
    if (e.code === 409) {
      console.log(`\nCollection already exists: ${name} (${id})`);
    } else {
      throw e;
    }
  }
}

async function setup() {
  // ── users ──────────────────────────────────────────────────────────────────
  await createCollection("users", "users");
  for (const key of ["userId", "email", "firstName", "lastName", "address1", "city", "state", "postalCode", "dateOfBirth", "ssn", "dwollaCustomerId", "dwollaCustomerUrl"]) {
    await createAttr("string", "users", key);
  }

  // ── bank ───────────────────────────────────────────────────────────────────
  await createCollection("bank", "bank");
  for (const key of ["userId", "bankId", "accountId", "accessToken", "fundingSourceUrl", "shareableId"]) {
    await createAttr("string", "bank", key);
  }

  // ── transactions ───────────────────────────────────────────────────────────
  await createCollection("transactions", "transactions");
  for (const key of ["name", "senderId", "senderBankId", "receiverId", "receiverBankId", "email", "channel", "category"]) {
    await createAttr("string", "transactions", key);
  }
  await createAttr("string", "transactions", "amount", { size: 50, required: true });

  console.log("\nDone! All collections and attributes are set up.");
}

setup().catch(console.error);
