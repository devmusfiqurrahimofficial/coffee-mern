// /**
//  * import-product-images.js
//  *
//  * Reads product image files from backend/images/ and imports them into MongoDB,
//  * matching each image to a product by name (case-insensitive, hyphen/underscore
//  * and camelCase aware).
//  *
//  * For each matched product it:
//  *  1. Inserts the image binary into the `productImages` collection
//  *  2. Sets the product's `image` field to `products/<imageId>`
//  *
//  * The backend's GET /images/products/:id route serves the image by _id, and
//  * toImageUrl() turns `products/<id>` into the full serving URL.
//  *
//  * Usage (from the backend folder):
//  *   node import-product-images.js
//  */

// require("dotenv").config();
// const fs = require("fs");
// const path = require("path");
// const { MongoClient } = require("mongodb");

// const IMAGES_DIR = path.join(__dirname, "images");
// const MONGODB_URI = process.env.MONGODB_URI;
// const DB_NAME = "mydatabase";

// if (!MONGODB_URI) {
//   console.error("MONGODB_URI is not set in backend/.env");
//   process.exit(1);
// }

// // Map file extension -> content type
// function contentTypeFor(file) {
//   const ext = path.extname(file).toLowerCase();
//   switch (ext) {
//     case ".jpg":
//     case ".jpeg":
//       return "image/jpeg";
//     case ".png":
//       return "image/png";
//     case ".webp":
//       return "image/webp";
//     case ".gif":
//       return "image/gif";
//     default:
//       return "application/octet-stream";
//   }
// }

// // Normalize a name for fuzzy matching:
// //  strip extension, split camelCase, replace punctuation with spaces, lowercase
// function normalize(name) {
//   return name
//     .replace(/\.[^/.]+$/, "") // strip file extension
//     .replace(/([a-z0-9])([A-Z])/g, "$1 $2") // casadioMachine -> casadio Machine
//     .replace(/[^a-z0-9]+/gi, " ") // punctuation -> space
//     .replace(/\s+/g, " ")
//     .trim()
//     .toLowerCase();
// }

// async function main() {
//   const client = new MongoClient(MONGODB_URI);
//   await client.connect();
//   try {
//     const db = client.db(DB_NAME);
//     const productCollection = db.collection("products");
//     const imageCollection = db.collection("productImages");

//     // Read image files
//     if (!fs.existsSync(IMAGES_DIR)) {
//       console.error(`Images directory not found: ${IMAGES_DIR}`);
//       process.exit(1);
//     }
//     const imageFiles = fs
//       .readdirSync(IMAGES_DIR)
//       .filter((f) => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));

//     console.log(`Found ${imageFiles.length} image file(s) in ${IMAGES_DIR}`);

//     // Fetch existing products
//     const products = await productCollection.find().toArray();
//     console.log(`Found ${products.length} product(s) in MongoDB`);

//     // Build a lookup of normalized product name -> product
//     const productByName = new Map();
//     for (const p of products) {
//       const key = normalize(p.name || "");
//       if (!productByName.has(key)) {
//         productByName.set(key, p);
//       }
//     }

//     let imported = 0;
//     let matched = 0;
//     let unmatched = [];
//     let skipped = 0;

//     for (const file of imageFiles) {
//       const filePath = path.join(IMAGES_DIR, file);
//       const fileKey = normalize(file);
//       const product = productByName.get(fileKey);

//       if (!product) {
//         unmatched.push(file);
//         continue;
//       }

//       // Skip if product already has an image
//       if (product.image) {
//         console.log(`  skip (already has image): ${product.name} <- ${file}`);
//         skipped++;
//         continue;
//       }

//       const data = fs.readFileSync(filePath);
//       const contentType = contentTypeFor(file);
//       const imageId = require("crypto").randomUUID();

//       await imageCollection.insertOne({
//         _id: imageId,
//         data,
//         contentType,
//         createdAt: new Date(),
//       });

//       await productCollection.updateOne(
//         { _id: product._id },
//         { $set: { image: `products/${imageId}` } }
//       );

//       console.log(
//         `  imported: ${product.name} (${product._id}) <- ${file} -> products/${imageId}`
//       );
//       imported++;
//       matched++;
//     }

//     console.log("\n--- Summary ---");
//     console.log(`Images found:   ${imageFiles.length}`);
//     console.log(`Matched:        ${matched}`);
//     console.log(`Imported:       ${imported}`);
//     console.log(`Skipped (exists): ${skipped}`);
//     console.log(`Unmatched:      ${unmatched.length}`);
//     if (unmatched.length) {
//       console.log("Unmatched files:");
//       for (const f of unmatched) {
//         console.log(`   - ${f}`);
//       }
//     }
//   } finally {
//     await client.close();
//   }
// }

// main().catch((err) => {
//   console.error("Import failed:", err);
//   process.exit(1);
// });
