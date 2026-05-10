import { Client, Account, Databases, ID } from "node-appwrite";
import dwolla from "dwolla-v2";

const PROJECT_ID = "690752f9003a03ba4d8f";
const API_KEY =
  "standard_a2d2d623b8fec41f726139d4cf1b215556dff9c1c229f8b22530c364b5147725d1befe533b7ee47c552cd1b4c3a58f910a37ebfb0de9cf29a966feb8b0aab0c191e6fe8a907364703cc5311b4d38c8bf73f97d0a6582fa666f0d9db86acf5915de3ccb83f71936d59e053db9317333aae71f50dfeff1ecfdf31d790bbf7dc4ae";
const DATABASE_ID = "6907531300115da60a9e";
const USER_COLLECTION_ID = "users";

// ── User details ──────────────────────────────────────────────────────────────
const userData = {
  firstName: "John",
  lastName: "Smith",
  address1: "123 Main Street",
  city: "New York",
  state: "NY",
  postalCode: "10001",
  dateOfBirth: "1990-05-15",
  ssn: "1234",
  email: "john.smith@aurex.dev",
  password: "Password123!",
};

// ── Appwrite client ───────────────────────────────────────────────────────────
const appwriteClient = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const account = new Account(appwriteClient);
const database = new Databases(appwriteClient);

// ── Dwolla client ─────────────────────────────────────────────────────────────
const dwollaClient = new dwolla.Client({
  environment: "sandbox",
  key: "9z5xoq0u7ABLYfOoQw0vtLySe3LncC52G86xQmTcrFwPI54qHs",
  secret: "gFkT1epQoLfcmkvsO7Gueai8xuzRH7R1Ght5R4AVQjfHQmIITH",
});

async function main() {
  const { email, password, firstName, lastName, ...rest } = userData;

  // 1. Create Appwrite auth account
  console.log("1. Creating Appwrite account...");
  let newAccount;
  try {
    newAccount = await account.create(
      ID.unique(),
      email,
      password,
      `${firstName} ${lastName}`
    );
    console.log("   ✓ Appwrite account created:", newAccount.$id);
  } catch (e) {
    if (e.code === 409) {
      console.error("   ✗ An account with this email already exists.");
      process.exit(1);
    }
    throw e;
  }

  // 2. Create Dwolla customer
  console.log("2. Creating Dwolla customer...");
  let dwollaCustomerUrl;
  try {
    const res = await dwollaClient.post("customers", {
      firstName,
      lastName,
      email,
      type: "personal",
      address1: rest.address1,
      city: rest.city,
      state: rest.state,
      postalCode: rest.postalCode,
      dateOfBirth: rest.dateOfBirth,
      ssn: rest.ssn,
    });
    dwollaCustomerUrl = res.headers.get("location");
    console.log("   ✓ Dwolla customer created:", dwollaCustomerUrl);
  } catch (e) {
    // If duplicate, reuse the existing customer URL from the error body
    const existing = e.body?._embedded?.errors?.[0]?._links?.about?.href;
    if (existing) {
      dwollaCustomerUrl = existing;
      console.log("   ~ Dwolla customer already exists, reusing:", dwollaCustomerUrl);
    } else {
      console.error("   ✗ Dwolla error:", JSON.stringify(e.body ?? e.message));
      process.exit(1);
    }
  }

  const dwollaCustomerId = dwollaCustomerUrl.split("/").pop();

  // 3. Store user in Appwrite database
  console.log("3. Saving user to database...");
  const newUser = await database.createDocument(
    DATABASE_ID,
    USER_COLLECTION_ID,
    ID.unique(),
    {
      ...rest,
      firstName,
      lastName,
      email,
      userId: newAccount.$id,
      dwollaCustomerId,
      dwollaCustomerUrl,
    }
  );
  console.log("   ✓ User document created:", newUser.$id);

  console.log("\n✅ User created successfully!");
  console.log("─────────────────────────────────");
  console.log("  Email   :", email);
  console.log("  Password:", password);
  console.log("─────────────────────────────────");
  console.log("You can now sign in at http://localhost:3000/sign-in");
}

main().catch(console.error);
