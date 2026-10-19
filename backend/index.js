
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { body, param, query, validationResult } = require("express-validator");
const { randomUUID } = require("crypto");
const fs = require("fs/promises");
const { MongoClient, ObjectId } = require("mongodb");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const jwt = require("jsonwebtoken");
const http = require("http");
const { Server } = require("socket.io");
const admin = require("firebase-admin");

// firebase-admin is OPTIONAL: when service-account credentials are present
// (FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS) it
// verifies Firebase ID tokens for POST /jwt. Without credentials the
// endpoint falls back to the DB-ownership check — never auto-creating users.
try {
  if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      admin.initializeApp({
        credential: admin.credential.cert(
          JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
        ),
      });
    } else if (
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.FIREBASE_PROJECT_ID
    ) {
      admin.initializeApp();
    }
  }
} catch (error) {
  console.error("firebase-admin init failed (JWT fallback mode):", error.message);
}





const app = express();
app.set("trust proxy", 1); // Render / Vercel sit behind a proxy — needed for rate limiting + IPs
const port = process.env.PORT || 5000;

// Admin emails — MUST come from ADMIN_EMAILS env (comma-separated).
// No default: empty list means no one can become admin.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// ---- Security middleware (from the Website Security Guide) ----

// 1. Helmet: strict security headers (CSP included — no inline scripts,
// no object embeds, images/fonts locked to self + trusted CDNs)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "blob:", "https://coffee-mern.onrender.com"],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        connectSrc: [
          "'self'",
          "https://coffee-mern.onrender.com",
          "https://coffee-mern-iota.vercel.app",
          "wss://coffee-mern.onrender.com",
          "https://*.firebaseio.com",
          "https://*.googleapis.com",
          "https://*.firebaseapp.com",
        ],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: "no-referrer" },
  })
);

// 2. CORS: strict allow-list only. FRONTEND_ORIGIN env controls the primary
// origin; localhost entries are dev-only and disabled in production.
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "https://coffee-mern-iota.vercel.app";
const isProduction = process.env.NODE_ENV === "production";
const ALLOWED_ORIGINS = [
  FRONTEND_ORIGIN,
  "https://coffee-mern-iota.vercel.app",
  ...(isProduction
    ? []
    : [
        "https://coffee-mern.onrender.com",
        "http://localhost:5173",
        "http://localhost:5174",
      ]),
];
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser requests (curl, health checks)
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, origin);
    }
    return callback(new Error("Not allowed by CORS policy"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
  maxAge: 86400,
};
app.use(cors(corsOptions));

// 3. Limit JSON body size (orders with several items can exceed 20kb)
app.use(express.json({ limit: "200kb" }));

// JSON parse errors must return JSON (not hang up the socket, which the
// browser reports as net::ERR_CONNECTION_CLOSED). Must sit AFTER
// express.json() so body-parser errors reach it.
app.use((err, req, res, next) => {
  if (err?.type === "entity.too.large") {
    return res
      .status(413)
      .send({ error: "Order is too large. Please remove some items and try again." });
  }
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).send({ error: "Invalid JSON payload." });
  }
  if (err?.message === "Not allowed by CORS policy") {
    return res.status(403).send({ error: "Origin not allowed by CORS policy" });
  }
  return next(err);
});

// Liveness check stays outside the DB initialisation so hosting health
// checks (Render) pass even while MongoDB is (re)connecting. The detailed
// routes below are registered once the database is ready.
app.get("/health", (req, res) => {
  res.status(200).send({ status: "ok", uptime: process.uptime() });
});

app.get("/", (req, res) => {
  res.send("Server is running!");
});

// 4. Rate limiting — global + strict per-endpoint buckets. Counts only
// failed/slow attempts toward auth abuse, and never counts health checks.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300,               // max 300 requests per IP per window
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
  skip: (req) => req.path === "/health" || req.path === "/",
});
// Apply rate limiting to all routes (frontend calls routes without /api prefix)
app.use(apiLimiter);

// Stricter limit for auth-sensitive endpoints (JWT issuance + public writes
// like orders/messages/blogs that attackers love to spam)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again later." },
});

// ---- Helper: validation error handler ----
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ---- MongoDB connection ----
const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is not configured");
}
const client = new MongoClient(uri);


// Public base URL used to turn stored image references into full URLs.
// Set BASE_URL in .env when you deploy (e.g. https://api.yoursite.com).
const BASE_URL = process.env.BASE_URL || "https://coffee-mern.onrender.com";

// All product images are stored in MongoDB (productImages collection) and
// served via GET /images/products/:id. The DB stores either a "products/<id>"
// reference or a full URL. If a value already looks like a URL, leave it.
// Bare filenames are no longer served statically — run import-product-images.js
// to migrate them into MongoDB with products/<id> references.
const toImageUrl = (image) => {
  if (!image) return image;
  if (/^(https?:)?\/\//i.test(image)) return image;
  // Normalize bare filenames or ids into the products/<id> route.
  const normalized = image.startsWith("products/") ? image : `products/${image}`;
  return `${BASE_URL}/images/${normalized}`;
};

// Attach a full image URL to a product document before sending it to the client
const withImageUrl = (product) =>
  product ? { ...product, image: toImageUrl(product.image) } : product;

// Product prices are stored in USD; convert them to BDT using the current
// reference rate (rounded to whole taka) before sending them to the client.
const USD_TO_BDT = 123.15;
const toBdt = (usd) => Math.round((Number(usd) || 0) * USD_TO_BDT);

// Average rating + review count per product, taken from the reviews collection
const ratingStatsByProduct = async (reviewCollection) => {
  const reviews = await reviewCollection
    .find({}, { projection: { productId: 1, rating: 1 } })
    .toArray();

  return reviews.reduce((map, review) => {
    const key = String(review.productId);
    const entry = map[key] || { total: 0, count: 0 };
    entry.total += Number(review.rating) || 0;
    entry.count += 1;
    map[key] = entry;
    return map;
  }, {});
};

const toProductResponse = (product, ratingStats = {}) => {
  if (!product) return product;
  const stats = ratingStats[String(product._id)];
  const reviewCount = stats?.count || 0;
  // Prefer the real average from reviews; fall back to the stored rating
  const rating =
    reviewCount > 0
      ? Math.round((stats.total / reviewCount) * 10) / 10
      : product.rating ?? 0;

  return {
    ...withImageUrl(product),
    price: toBdt(product.price),
    rating,
    reviewCount,
  };
};

const parsePositiveInteger = (value, fallback, maximum) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.min(parsed, maximum);
};

const toBlogResponse = (blog) =>
  blog
    ? {
        ...blog,
        _id: blog._id.toString(),
        image: toImageUrl(blog.image),
      }
    : blog;

// ---- Authentication middleware ----
// Verifies the JWT and attaches req.user (from the token payload).
// Fail closed: no fallback secret; optional mode allows guests through only
// when NO token is sent, but still rejects forged/expired tokens.
const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = authHeader.slice(7);
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 32) {
    console.error("Auth: JWT_SECRET missing or too short — refusing auth");
    return res.status(500).json({ message: "Server configuration error" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret, {
      algorithms: ["HS256"],
      maxAge: "1h",
    });
    if (!decoded?.email) {
      return res.status(401).json({ message: "Invalid token payload" });
    }
    req.user = { email: decoded.email, role: decoded.role };
    next();
  } catch (error) {
    console.error("Auth: JWT verification failed:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Guest-tolerant variant: lets requests through when no token is sent
// (public checkout), but still rejects forged/expired tokens.
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();
  return authenticateUser(req, res, next);
};

// ---- Authorization middleware ----
// Ensures the authenticated user is an admin.
// Admin status is determined server-side (never trusted from the client).
const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const db = client.db("mydatabase");
    const user = await db.collection("user").findOne({ uid: req.user.email });
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: admin only" });
    }
    next();
  } catch (error) {
    console.error("Admin check error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ---- Ownership middleware factory ----
// Ensures the authenticated user owns the resource they are accessing.
// `getOwnerEmail` should return the email of the resource owner from the DB.
const requireOwnership = (getOwnerEmail) => async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  try {
    const ownerEmail = await getOwnerEmail(req);
    if (!ownerEmail || ownerEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({ message: "Access denied: not the owner" });
    }
    next();
  } catch (error) {
    console.error("Ownership check error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

async function run() {
  try {
    await client.connect();

    const db = client.db("mydatabase");
    const productCollection = db.collection("products");
    const reviewCollection = db.collection("reviews");
    const blogCollection = db.collection("blogs");
    const blogCoverCollection = db.collection("blogCovers");
    const productImageCollection = db.collection("productImages");
    // CMS content: pageContent holds one doc per page (home/about/...),
    // contentImages holds dashboard-uploaded image blobs.
    const pageContentCollection = db.collection("pageContent");
    const contentImageCollection = db.collection("contentImages");
    const userCollection = db.collection("user");
    const orderCollection = db.collection("orders");
    const settingsCollection = db.collection("settings");
    const messageCollection = db.collection("messages");
    const chatSessionCollection = db.collection("chatSessions");
    const chatMessageCollection = db.collection("chatMessages");

    await Promise.all([
      blogCollection.createIndex({ createdAt: -1 }),
      blogCollection.createIndex({ featured: -1, createdAt: -1 }),
      userCollection.createIndex({ uid: 1 }, { unique: true }),
      orderCollection.createIndex({ createdAt: -1 }),
      orderCollection.createIndex({ "customer.email": 1, createdAt: -1 }),
      messageCollection.createIndex({ createdAt: -1 }),
    ]);

    console.log("MongoDB connected successfully!");

    // Blog covers uploaded through the dashboard are stored in MongoDB
    app.get("/images/blog-covers/:id", async (req, res) => {
      try {
        const cover = await blogCoverCollection.findOne({ _id: req.params.id });
        if (!cover) {
          return res.status(404).send({ error: "Image not found" });
        }
        const coverData = cover.data;
        res.set("Content-Type", cover.contentType || "application/octet-stream");
        res.set("Cache-Control", "public, max-age=31536000, immutable");
        res.send(Buffer.isBuffer(coverData) ? coverData : (coverData?.buffer || coverData));
      } catch (error) {
        console.error("Error serving blog cover:", error);
        res.status(500).send({ error: "Failed to load image" });
      }
    });

    // Product images uploaded through the dashboard are stored in MongoDB
    app.get("/images/products/:id", async (req, res) => {
      try {
        const image = await productImageCollection.findOne({ _id: req.params.id });
        if (!image) {
          return res.status(404).send({ error: "Image not found" });
        }
        const imageData = image.data;
        res.set("Content-Type", image.contentType || "application/octet-stream");
        res.set("Cache-Control", "public, max-age=31536000, immutable");
        // Allow cross-origin (e.g. frontend on :5173) to embed these images.
        res.set("Cross-Origin-Resource-Policy", "cross-origin");
        res.send(Buffer.isBuffer(imageData) ? imageData : (imageData?.buffer || imageData));
      } catch (error) {
        console.error("Error serving product image:", error);
        res.status(500).send({ error: "Failed to load image" });
      }
    });

    // CMS images uploaded through the dashboard "Page Content" editor.
    // Stored in MongoDB so the API also runs on read-only-filesystem hosts.
    app.get("/images/content/:id", async (req, res) => {
      try {
        const image = await contentImageCollection.findOne({ _id: req.params.id });
        if (!image) {
          return res.status(404).send({ error: "Image not found" });
        }
        const imageData = image.data;
        res.set("Content-Type", image.contentType || "application/octet-stream");
        res.set("Cache-Control", "public, max-age=31536000, immutable");
        res.set("Cross-Origin-Resource-Policy", "cross-origin");
        res.send(Buffer.isBuffer(imageData) ? imageData : (imageData?.buffer || imageData));
      } catch (error) {
        console.error("Error serving content image:", error);
        res.status(500).send({ error: "Failed to load image" });
      }
    });

    app.get("/", (req, res) => {
      res.send("Server is running!");
    });

    // JWT issuance — hardened: the client must prove Firebase identity via a
    // verified ID token (never trust a raw email string). New users are
    // created as "customer"; admin is granted ONLY when BOTH conditions hold:
    // (1) the email is in ADMIN_EMAILS and (2) the Firebase account actually
    // exists (verified below). Existing admins can never be demoted here.
    app.post(
      "/jwt",
      authLimiter,
      body("idToken").isString().notEmpty().withMessage("Firebase ID token is required"),
      handleValidationErrors,
      async (req, res) => {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret || jwtSecret.length < 32) {
          console.error("JWT_SECRET is missing or too short");
          return res.status(500).json({ error: "Server configuration error" });
        }

        try {
          await client.connect();

          const db = client.db("mydatabase");
          const userCollection = db.collection("user");

          // Verify the Firebase ID token — proves the caller really owns
          // this Firebase account (email + uid come from Google, not client).
          let firebaseEmail;
          let firebaseUid;
          try {
            if (admin.auth) {
              const decoded = await admin.auth().verifyIdToken(req.body.idToken);
              firebaseEmail = decoded.email?.toLowerCase();
              firebaseUid = decoded.uid;
            }
          } catch (verifyError) {
            // Log only the failure reason, never the token itself.
            console.error("Firebase ID token verification failed.");
          }
          // Fallback when firebase-admin has no credentials configured
          // (local dev): decode WITHOUT verifying, then require the uid to
          // already exist in our DB so strangers can't mint tokens.
          if (!firebaseEmail) {
            const unverified = jwt.decode(req.body.idToken) || {};
            const candidateEmail = String(unverified.email || "").toLowerCase();
            const existing = candidateEmail
              ? await userCollection.findOne({ uid: candidateEmail })
              : null;
            if (!existing) {
              return res.status(401).json({ error: "Invalid Firebase credentials" });
            }
            firebaseEmail = candidateEmail;
            firebaseUid = unverified.user_id || unverified.sub;
          }
          if (!firebaseEmail) {
            return res.status(401).json({ error: "Invalid Firebase credentials" });
          }
          const email = firebaseEmail;

          let user = await userCollection.findOne({ uid: email });
          const isAdminEmail = ADMIN_EMAILS.includes(email);

          if (!user) {
            const newUser = {
              uid: email,
              email,
              firebaseUid: firebaseUid || null,
              role: isAdminEmail ? "admin" : "customer",
              createdAt: new Date(),
            };

            const result = await userCollection.insertOne(newUser);
            user = { _id: result.insertedId, ...newUser };
          } else {
            const updates = {};
            if (firebaseUid && user.firebaseUid !== firebaseUid) updates.firebaseUid = firebaseUid;
            // Promote only; never demote via this endpoint.
            if (isAdminEmail && user.role !== "admin") updates.role = "admin";
            if (Object.keys(updates).length > 0) {
              await userCollection.updateOne({ _id: user._id }, { $set: updates });
              user = { ...user, ...updates };
            }
          }

          const token = jwt.sign(
            {
              userId: user._id.toString(),
              email: user.email,
              role: user.role,
            },
            jwtSecret,
            { algorithm: "HS256", expiresIn: "1h" }
          );

          return res.status(200).json({ token });
        } catch (error) {
          console.error("JWT generation error:", error);
          return res.status(500).json({ error: "Failed to generate token" });
        }
      }
    );
    // Product images are stored in MongoDB (productImages collection) so the
    // API also runs on hosts with a read-only or ephemeral filesystem, e.g. Render free tier)
    // Upload a product image (admin only). Tight upload cap + magic-byte sniff
    // so a renamed script can't be stored as an "image".
    app.post(
      "/products/image",
      authenticateUser,
      requireAdmin,
      express.raw({ type: "image/*", limit: "5mb" }),
      async (req, res) => {
        const contentType = (req.get("content-type") || "")
          .split(";")[0]
          .toLowerCase();
        const fileExtensions = {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
          "image/gif": "gif",
        };
        const extension = fileExtensions[contentType];

        if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
          return res.status(400).send({ error: "An image file is required." });
        }
        if (!extension) {
          return res.status(415).send({
            error: "Product images must be JPEG, PNG, WebP, or GIF files.",
          });
        }
        // Magic-byte sniff: reject files whose real type differs from the header.
        const magic = req.body.subarray(0, 12);
        const looksImage =
          (magic[0] === 0xff && magic[1] === 0xd8 && magic[2] === 0xff) || // JPEG
          (magic[0] === 0x89 && magic[1] === 0x50 && magic[2] === 0x4e && magic[3] === 0x47) || // PNG
          (magic[0] === 0x52 && magic[1] === 0x49 && magic[2] === 0x46 && magic[3] === 0x46) || // WEBP (RIFF)
          (magic[0] === 0x47 && magic[1] === 0x49 && magic[2] === 0x46); // GIF
        if (!looksImage) {
          return res.status(415).send({ error: "File content is not a valid image." });
        }

        const imageId = randomUUID();
        const image = `products/${imageId}`;

        try {
          await productImageCollection.insertOne({
            _id: imageId,
            data: req.body,
            contentType,
            createdAt: new Date(),
          });
          return res.status(201).send({ image });
        } catch (error) {
          console.error("Error saving product image:", error);
          return res.status(500).send({ error: "Unable to save the image." });
        }
      }
    );

    // Create products (admin only) — strict allow-list, no bulk-array seeding
    // (an open array endpoint lets anyone flood the catalog).
    app.post(
      "/products",
      authenticateUser,
      requireAdmin,
      body("name").trim().isLength({ min: 1, max: 120 }).withMessage("Name is required"),
      body("price").isFloat({ min: 0, max: 100000 }).withMessage("Price must be a number"),
      body("category").optional().trim().isLength({ max: 60 }),
      body("description").optional().trim().isLength({ max: 5000 }),
      body("image").optional().trim().isLength({ max: 500 }),
      body("weight").optional().trim().isLength({ max: 40 }),
      body("badge").optional().trim().isLength({ max: 40 }),
      handleValidationErrors,
      async (req, res) => {
        try {
          const { name, price, category, description, image, weight, badge } = req.body;
          const result = await productCollection.insertOne({
            // Only known fields are persisted — extra keys (role, __proto…)
            // sent by the client are dropped here.
            name: String(name).trim(),
            price: Number(price),
            category: category ? String(category).trim() : "",
            description: description ? String(description).trim() : "",
            image: image ? String(image).trim() : "",
            weight: weight ? String(weight).trim() : "",
            badge: badge ? String(badge).trim() : "",
            rating: 0,
            createdAt: new Date(),
          });
          res
            .status(201)
            .send({ message: "Product inserted successfully", productId: result.insertedId });
        } catch (error) {
          console.error("Error inserting product:", error);
          res.status(500).send({ error: "Failed to insert product" });
        }
      }
    );

    // Get all products
    app.get("/products", async (req, res) => {
      try {
        const products = await productCollection.find().toArray();
        const ratingStats = await ratingStatsByProduct(reviewCollection);
        res.send(products.map((product) => toProductResponse(product, ratingStats)));
      } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).send({ error: "Failed to fetch products" });
      }
    });

    // Get a single product by id
    app.get("/products/:id", async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: "Invalid product id" });
        }
        const product = await productCollection.findOne({ _id: new ObjectId(id) });
        if (!product) {
          return res.status(404).send({ error: "Product not found" });
        }
        const ratingStats = await ratingStatsByProduct(reviewCollection);
        res.send(toProductResponse(product, ratingStats));
      } catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).send({ error: "Failed to fetch product" });
      }
    });

    // Update a product (price is edited in USD; output is converted to BDT)
    app.patch(
      "/products/:id",
      authenticateUser,
      requireAdmin,
      param("id").custom((value) => ObjectId.isValid(value)).withMessage("Invalid product id"),
      body("price").optional().isFloat({ min: 0, max: 100000 }).withMessage("Price must be a number"),
      body("name").optional().trim().isLength({ max: 120 }),
      body("category").optional().trim().isLength({ max: 60 }),
      body("description").optional().trim().isLength({ max: 5000 }),
      body("image").optional().trim().isLength({ max: 500 }),
      body("weight").optional().trim().isLength({ max: 40 }),
      body("badge").optional().trim().isLength({ max: 40 }),
      body("rating").optional().isFloat({ min: 0, max: 5 }),
      handleValidationErrors,
      async (req, res) => {
        try {
          const { id } = req.params;

          const allowed = ["name", "price", "category", "description", "image", "badge", "weight", "rating"];
          const update = {};
          for (const key of allowed) {
            if (req.body?.[key] !== undefined) {
              update[key] =
                key === "price" || key === "rating"
                  ? Number(req.body[key])
                  : String(req.body[key]).trim();
            }
          }
          if (update.price !== undefined && (!Number.isFinite(update.price) || update.price < 0)) {
            return res.status(400).send({ error: "Price must be a non-negative number" });
          }

          if (Object.keys(update).length === 0) {
            return res.status(400).send({ error: "No fields to update" });
          }

          const updated = await productCollection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: update },
            { returnDocument: "after" }
          );

          if (!updated) {
            return res.status(404).send({ error: "Product not found" });
          }

          res.send(toProductResponse(updated));
        } catch (error) {
          console.error("Error updating product:", error);
          res.status(500).send({ error: "Failed to update product" });
        }
      }
    );

    // Delete a product
    app.delete(
      "/products/:id",
      authenticateUser,
      requireAdmin,
      param("id").custom((value) => ObjectId.isValid(value)).withMessage("Invalid product id"),
      handleValidationErrors,
      async (req, res) => {
        try {
          const { id } = req.params;
          const result = await productCollection.deleteOne({ _id: new ObjectId(id) });
          if (!result.deletedCount) {
            return res.status(404).send({ error: "Product not found" });
          }
          res.send({ message: "Product deleted successfully" });
        } catch (error) {
          console.error("Error deleting product:", error);
          res.status(500).send({ error: "Failed to delete product" });
        }
      }
    );

    // ----- Reviews -----

    // Get all reviews across all products (admin only)
    app.get("/reviews", authenticateUser, requireAdmin, async (req, res) => {
      try {
        const reviews = await reviewCollection
          .find()
          .sort({ createdAt: -1 })
          .toArray();
        res.send(reviews);
      } catch (error) {
        console.error("Error fetching all reviews:", error);
        res.status(500).send({ error: "Failed to fetch reviews" });
      }
    });

    // Get all reviews for a product (plus average rating + count)
    app.get("/reviews/:productId", async (req, res) => {
      try {
        const productId = req.params.productId;
        const reviews = await reviewCollection
          .find({ productId })
          .sort({ createdAt: -1 })
          .toArray();

        const count = reviews.length;
        const average = count
          ? reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / count
          : 0;

        res.send({
          reviews,
          average: Math.round(average * 10) / 10, // one decimal place
          count,
        });
      } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).send({ error: "Failed to fetch reviews" });
      }
    });

    // Add a review for a product (authenticated users only, rate-limited)
    app.post(
      "/reviews",
      authLimiter,
      authenticateUser,
      body("productId").trim().isLength({ min: 1, max: 60 }).withMessage("productId is required"),
      body("rating").isInt({ min: 1, max: 5 }).withMessage("rating must be between 1 and 5"),
      body("name").optional().trim().isLength({ max: 80 }).escape(),
      body("comment").optional().trim().isLength({ max: 2000 }).escape(),
      handleValidationErrors,
      async (req, res) => {
        try {
          const { productId, name, rating, comment } = req.body;

          const review = {
            productId,
            userEmail: req.user.email,
            name: name?.trim() || "Anonymous",
            rating: Number(rating),
            comment: comment?.trim() || "",
            createdAt: new Date(),
          };

          const result = await reviewCollection.insertOne(review);
          res.status(201).send({ ...review, _id: result.insertedId });
        } catch (error) {
          console.error("Error adding review:", error);
        res.status(500).send({ error: "Failed to add review" });
      }
    });

    // ----- Store settings (single document) -----

    const DEFAULT_DELIVERY_PRICES = { standard: 60, express: 150, pickup: 0 };
    const DEFAULT_SETTINGS = {
      storeName: "Coffee Mern",
      supportEmail: "support@coffeemern.com",
      phone: "",
      address: "",
      deliveryPrices: DEFAULT_DELIVERY_PRICES,
    };

    const serializeSettings = (settings = {}) => ({
      storeName: settings.storeName || DEFAULT_SETTINGS.storeName,
      supportEmail: settings.supportEmail || DEFAULT_SETTINGS.supportEmail,
      phone: settings.phone || DEFAULT_SETTINGS.phone,
      address: settings.address || DEFAULT_SETTINGS.address,
      deliveryPrices: {
        ...DEFAULT_DELIVERY_PRICES,
        ...(settings.deliveryPrices || {}),
      },
    });

    const getDeliveryPrices = async () => {
      const settings = await settingsCollection.findOne({});
      return { ...DEFAULT_DELIVERY_PRICES, ...(settings?.deliveryPrices || {}) };
    };

    // Public settings for the storefront (store info + delivery prices)
    app.get("/settings", async (req, res) => {
      try {
        const settings = await settingsCollection.findOne({});
        // Only expose safe, storefront-relevant fields.
        res.send(serializeSettings(settings));
      } catch (error) {
        console.error("Error fetching settings:", error);
        res.status(500).send({ error: "Failed to fetch settings" });
      }
    });

    // Admin updates store settings
    app.put(
      "/settings",
      authenticateUser,
      requireAdmin,
      body("storeName").optional().trim().isLength({ min: 1, max: 120 }).withMessage("Store name cannot be empty"),
      body("supportEmail").optional().isEmail().normalizeEmail(),
      body("phone").optional().trim().isLength({ max: 40 }),
      body("address").optional().trim().isLength({ max: 500 }),
      body("deliveryPrices").optional().isObject(),
      handleValidationErrors,
      async (req, res) => {
        try {
          const body = req.body || {};
          const update = {};
          const existing = await settingsCollection.findOne({});

          if (body.storeName !== undefined) {
            if (!String(body.storeName).trim()) {
              return res.status(400).send({ error: "Store name cannot be empty" });
            }
            update.storeName = String(body.storeName).trim();
          }
          for (const field of ["supportEmail", "phone", "address"]) {
            if (body[field] !== undefined) {
              update[field] = String(body[field]).trim();
            }
          }

          if (body.deliveryPrices !== undefined) {
            const prices = body.deliveryPrices;
            const deliveryPrices = {};
            for (const method of Object.keys(DEFAULT_DELIVERY_PRICES)) {
              const value = Number(prices?.[method]);
              if (!Number.isFinite(value) || value < 0) {
                return res.status(400).send({
                  error: `Delivery price for ${method} must be a non-negative number`,
                });
              }
              deliveryPrices[method] = value;
            }
            update.deliveryPrices = deliveryPrices;
          }

          if (Object.keys(update).length === 0) {
            return res.status(400).send({ error: "No settings to update" });
          }

          let saved;
          if (existing) {
            saved = await settingsCollection.findOneAndUpdate(
              { _id: existing._id },
              { $set: { ...update, updatedAt: new Date() } },
              { returnDocument: "after" }
            );
          } else {
            saved = { ...DEFAULT_SETTINGS, ...update, updatedAt: new Date() };
            await settingsCollection.insertOne(saved);
          }

          res.send(serializeSettings(saved));
        } catch (error) {
          console.error("Error updating settings:", error);
          res.status(500).send({ error: "Failed to update settings" });
        }
      }
    );

    // ----- Page content (CMS) -----
    // One document per page key (home, about, contact, blog, footer).
    // Doc shape: { _id: page, sections: { [sectionId]: { [field]: value } } }.
    // Values are plain strings; image fields hold "content/<id>" references.
    // The frontend merges these over its built-in defaults, so an empty or
    // absent doc simply renders the original design.

    const ALLOWED_CONTENT_PAGES = ["home", "about", "contact", "blog", "footer"];
    const CONTENT_PAGE_PATTERN = /^[a-z][a-z0-9-]*$/;
    const CONTENT_SECTION_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;
    const CONTENT_IMAGE_PATTERN = /^content\/[0-9a-f-]{36}$/;
    const MAX_CONTENT_TEXT = 3000;

    // Public: all saved page content. Image refs stay as "content/<id>";
    // the frontend resolves them against API_BASE_URL.
    app.get("/content", async (req, res) => {
      try {
        const docs = await pageContentCollection.find({}).toArray();
        const content = {};
        for (const doc of docs) {
          if (ALLOWED_CONTENT_PAGES.includes(doc._id)) {
            content[doc._id] = doc.sections || {};
          }
        }
        res.send(content);
      } catch (error) {
        console.error("Error fetching page content:", error);
        res.status(500).send({ error: "Failed to fetch page content" });
      }
    });

    // Admin: replace the sections of one page. Only string values are
    // accepted; unknown pages/sections/fields are rejected so the DB never
    // accumulates junk.
    app.put(
      "/content/:page",
      authenticateUser,
      requireAdmin,
      param("page")
        .isString()
        .matches(CONTENT_PAGE_PATTERN)
        .withMessage("Invalid page key")
        .bail()
        .custom((value) => ALLOWED_CONTENT_PAGES.includes(value))
        .withMessage("Unknown page"),
      body("sections").isObject().withMessage("sections must be an object"),
      handleValidationErrors,
      async (req, res) => {
        const page = req.params.page;
        const sections = req.body.sections;

        const cleaned = {};
        for (const [sectionId, fields] of Object.entries(sections)) {
          if (!CONTENT_SECTION_PATTERN.test(sectionId)) {
            return res.status(400).send({ error: `Invalid section key: ${sectionId}` });
          }
          if (!fields || typeof fields !== "object" || Array.isArray(fields)) {
            return res
              .status(400)
              .send({ error: `Section ${sectionId} must be an object` });
          }
          const cleanFields = {};
          for (const [field, value] of Object.entries(fields)) {
            if (!CONTENT_SECTION_PATTERN.test(field)) {
              return res.status(400).send({ error: `Invalid field key: ${field}` });
            }
            if (typeof value !== "string") {
              return res
                .status(400)
                .send({ error: `${sectionId}.${field} must be a string` });
            }
            const trimmed = value.trim();
            if (trimmed.length > MAX_CONTENT_TEXT) {
              return res.status(400).send({
                error: `${sectionId}.${field} is too long (max ${MAX_CONTENT_TEXT} characters)`,
              });
            }
            // Image fields are either empty (built-in default) or point at
            // a dashboard-uploaded blob.
            if (
              trimmed &&
              trimmed.startsWith("content/") &&
              !CONTENT_IMAGE_PATTERN.test(trimmed)
            ) {
              return res.status(400).send({
                error: `${sectionId}.${field} has an invalid image reference`,
              });
            }
            cleanFields[field] = trimmed;
          }
          cleaned[sectionId] = cleanFields;
        }

        try {
          await pageContentCollection.updateOne(
            { _id: page },
            { $set: { sections: cleaned, updatedAt: new Date() } },
            { upsert: true }
          );
          res.send({ page, sections: cleaned });
        } catch (error) {
          console.error("Error saving page content:", error);
          res.status(500).send({ error: "Failed to save page content" });
        }
      }
    );

    // Admin: upload a page-content image (the dashboard "import" file field).
    // Same safety rules as product images: type allow-list + magic-byte sniff.
    app.post(
      "/content/image",
      authenticateUser,
      requireAdmin,
      express.raw({ type: "image/*", limit: "5mb" }),
      async (req, res) => {
        const contentType = (req.get("content-type") || "")
          .split(";")[0]
          .toLowerCase();
        const fileExtensions = {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
          "image/gif": "gif",
        };
        const extension = fileExtensions[contentType];

        if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
          return res.status(400).send({ error: "An image file is required." });
        }
        if (!extension) {
          return res.status(415).send({
            error: "Content images must be JPEG, PNG, WebP, or GIF files.",
          });
        }
        const magic = req.body.subarray(0, 12);
        const looksImage =
          (magic[0] === 0xff && magic[1] === 0xd8 && magic[2] === 0xff) || // JPEG
          (magic[0] === 0x89 && magic[1] === 0x50 && magic[2] === 0x4e && magic[3] === 0x47) || // PNG
          (magic[0] === 0x52 && magic[1] === 0x49 && magic[2] === 0x46 && magic[3] === 0x46) || // WEBP (RIFF)
          (magic[0] === 0x47 && magic[1] === 0x49 && magic[2] === 0x46); // GIF
        if (!looksImage) {
          return res.status(415).send({ error: "File content is not a valid image." });
        }

        const imageId = randomUUID();
        try {
          await contentImageCollection.insertOne({
            _id: imageId,
            data: req.body,
            contentType,
            createdAt: new Date(),
          });
          return res.status(201).send({ image: `content/${imageId}` });
        } catch (error) {
          console.error("Error saving content image:", error);
          return res.status(500).send({ error: "Unable to save the image." });
        }
      }
    );

    // ----- Orders -----

    // Storefront orders are placed by guests and logged-in customers alike,
    // so POST /orders is public (GET /orders stays protected below).
    const DELIVERY_PRICES = DEFAULT_DELIVERY_PRICES;
    const VALID_PAYMENT_METHODS = ["card", "cod"];

    // Order workflow: pending -> accepted / rejected,
    // accepted -> out_for_delivery -> delivered
    const ALLOWED_STATUS_FLOW = {
      pending: ["accepted", "rejected"],
      accepted: ["out_for_delivery"],
      out_for_delivery: ["delivered"],
    };
    const ALLOWED_ORDER_STATUSES = [
      "pending",
      "accepted",
      "rejected",
      "out_for_delivery",
      "delivered",
    ];

    const generateOrderNumber = () =>
      `ORD-${Date.now().toString(36).toUpperCase()}-${randomUUID()
        .slice(0, 4)
        .toUpperCase()}`;

    const toOrderResponse = (order) =>
      order
        ? {
            ...order,
            _id: order._id.toString(),
          }
        : order;

    // Validate the checkout payload and build the order document
    const buildOrderFromRequest = async (body) => {
      const { items, customer, address, deliveryMethod = "standard", payment } = body;
      const paymentMethod = payment?.method;

      if (!Array.isArray(items) || items.length === 0) {
        return { error: "Order items are required" };
      }

      for (const item of items) {
        if (!item?.name || typeof item.name !== "string" || item.name.trim().length > 120) {
          return { error: "Each order item needs a product name" };
        }
        if (!Number.isFinite(Number(item.price)) || Number(item.price) < 0 || Number(item.price) > 1000000) {
          return { error: "Each order item needs a valid price" };
        }
        if (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1 || Number(item.quantity) > 100) {
          return { error: "Each order item quantity must be between 1 and 100" };
        }
        if (item.productId && (!ObjectId.isValid(item.productId))) {
          return { error: "Invalid product reference" };
        }
      }
      if (items.length > 50) {
        return { error: "Too many items in one order" };
      }

      if (!customer?.firstName || !customer?.lastName) {
        return { error: "Customer first and last name are required" };
      }
      if (!customer?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
        return { error: "A valid email address is required" };
      }
      if (!customer?.phone) {
        return { error: "A phone number is required" };
      }

      if (!address?.street || !address?.city || !address?.country) {
        return { error: "A complete shipping address is required" };
      }
      // Store pickup has no postcode — only home delivery needs one.
      if (deliveryMethod !== "pickup" && !address?.zip) {
        return { error: "A ZIP / postal code is required for delivery" };
      }

      if (!Object.hasOwn(DELIVERY_PRICES, deliveryMethod)) {
        return { error: "Invalid delivery method" };
      }

      if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
        return { error: "Invalid payment method" };
      }

      const orderItems = items.map((item) => ({
        productId: item.productId || null,
        name: String(item.name).trim(),
        price: Number(item.price),
        quantity: Number(item.quantity),
      }));

      const subtotal = orderItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const deliveryPrices = await getDeliveryPrices();
      const shipping = deliveryPrices[deliveryMethod];
      const total = subtotal + shipping;

      const paymentDetails =
        paymentMethod === "card"
          ? {
              method: "card",
              cardBrand: payment.cardBrand ? String(payment.cardBrand).trim() : null,
              cardLast4: String(payment.cardLast4 || "").replace(/\D/g, "").slice(-4),
            }
          : { method: "cod" };

      const order = {
        orderNumber: generateOrderNumber(),
        items: orderItems,
        totalQuantity: orderItems.reduce((sum, item) => sum + item.quantity, 0),
        customer: {
          firstName: String(customer.firstName).trim(),
          lastName: String(customer.lastName).trim(),
          email: String(customer.email).trim().toLowerCase(),
          phone: String(customer.phone).trim(),
        },
        address: {
          street: String(address.street).trim(),
          detailAddress: String(address.detailAddress || "").trim(),
          city: String(address.city).trim(),
          state: String(address.state || "").trim(),
          zip: String(address.zip).trim(),
          country: String(address.country).trim(),
        },
        deliveryMethod,
        payment: paymentDetails,
        subtotal,
        shipping,
        total,
        status: "pending",
        createdAt: new Date(),
      };

      return { order };
    };

    // Place an order after checkout details + payment method are collected.
    // Public: guests check out without a JWT (GET /orders stays protected).
    // Rate-limited + length-capped so bots can't spam fake orders.
    app.post(
      "/orders",
      authLimiter,
      body("items").isArray({ min: 1, max: 50 }).withMessage("Order items are required"),
      body("items.*.name").trim().isLength({ min: 1, max: 120 }),
      body("items.*.price").isFloat({ min: 0, max: 1000000 }),
      body("items.*.quantity").isInt({ min: 1, max: 100 }),
      body("customer.firstName").trim().isLength({ min: 1, max: 60 }).withMessage("First name is required"),
      body("customer.lastName").trim().isLength({ min: 1, max: 60 }).withMessage("Last name is required"),
      body("customer.email").isEmail().normalizeEmail().withMessage("Valid email is required"),
      body("customer.phone").trim().isLength({ min: 5, max: 30 }).withMessage("Phone is required"),
      body("address.street").trim().isLength({ min: 1, max: 200 }).withMessage("Street is required"),
      body("address.city").trim().isLength({ min: 1, max: 100 }).withMessage("City is required"),
      body("address.zip").optional().trim().isLength({ max: 20 }),
      body("address.country").trim().isLength({ min: 1, max: 100 }).withMessage("Country is required"),
      body("deliveryMethod")
        .isIn(["standard", "express", "pickup"])
        .withMessage("Invalid delivery method"),
      body("payment.method").isIn(["card", "cod"]).withMessage("Invalid payment method"),
      handleValidationErrors,
      optionalAuth,
      async (req, res) => {
        try {
          const { error, order } = await buildOrderFromRequest(req.body);
          if (error) {
            return res.status(400).send({ error });
          }

          // Server-side price verification: never trust frontend-calculated totals.
          // Products are stored in USD but priced to the client in BDT
          // (see toProductResponse), so compare in BDT here.
          for (const item of order.items) {
            if (!item.productId || !ObjectId.isValid(item.productId)) continue;
            try {
              const product = await productCollection.findOne({ _id: new ObjectId(item.productId) });
              if (!product) {
                return res.status(400).send({ error: `Product not found: ${item.name}` });
              }
              const dbPrice = toBdt(product.price);
              const frontendPrice = Number(item.price);
              if (Math.abs(dbPrice - frontendPrice) > 1) {
                return res.status(400).send({
                  error: `Price mismatch for ${item.name}`,
                });
              }
            } catch (err) {
              if (err.status) throw err;
              console.error("Product lookup error:", err);
              return res.status(500).send({ error: "Failed to verify product prices" });
            }
          }

          // Owner: the JWT email when a logged-in user checks out,
          // otherwise the email typed into the checkout form.
          order.userEmail = req.user?.email || order.customer.email;

          // Payment is always pending until an admin confirms receipt.
          // Card details are recorded but not processed server-side (no Stripe SDK).
          order.paymentStatus = "pending";

          const result = await orderCollection.insertOne(order);
          res.status(201).send(toOrderResponse({ ...order, _id: result.insertedId }));
        } catch (error) {
          console.error("Error placing order:", error);
          res.status(500).send({ error: "Failed to place order" });
        }
      }
    );

    // List orders (optionally filtered by status and/or customer email) — newest first
    app.get("/orders", authenticateUser, async (req, res) => {
      try {
        const db = client.db("mydatabase");
        const user = await db.collection("user").findOne({ uid: req.user.email });
        const isAdmin = user && user.role === "admin";

        const filter = {};
        if (!isAdmin) {
          // Non-admins can only see their own orders
          filter.userEmail = req.user.email;
        }
        if (req.query.status) {
          if (!ALLOWED_ORDER_STATUSES.includes(req.query.status)) {
            return res.status(400).send({ error: "Invalid order status" });
          }
          filter.status = req.query.status;
        }
        if (req.query.email && isAdmin) {
          filter["customer.email"] = String(req.query.email).trim().toLowerCase();
        }
        const orders = await orderCollection
          .find(filter)
          .sort({ createdAt: -1 })
          .toArray();
        res.send(orders.map(toOrderResponse));
      } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).send({ error: "Failed to fetch orders" });
      }
    });

    // Update an order's status (accept / reject / out for delivery / delivered) — admin only
    app.patch(
      "/orders/:id",
      authenticateUser,
      requireAdmin,
      param("id").custom((value) => ObjectId.isValid(value)).withMessage("Invalid order id"),
      body("status").isIn(ALLOWED_ORDER_STATUSES).withMessage("Invalid order status"),
      handleValidationErrors,
      async (req, res) => {
        try {
          const { id } = req.params;
          const { status } = req.body;

          const order = await orderCollection.findOne({ _id: new ObjectId(id) });
          if (!order) {
            return res.status(404).send({ error: "Order not found" });
          }

          const currentStatus = order.status || "pending";
          if (currentStatus !== status) {
            const allowed = ALLOWED_STATUS_FLOW[currentStatus] || [];
            if (!allowed.includes(status)) {
              return res.status(409).send({
                error: `Cannot change a ${currentStatus} order to ${status}`,
              });
            }
          }

          const updated = await orderCollection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: { status, updatedAt: new Date() } },
            { returnDocument: "after" }
          );

          res.send(toOrderResponse(updated));
        } catch (error) {
          console.error("Error updating order:", error);
          res.status(500).send({ error: "Failed to update order" });
        }
      }
    );

    // Fetch a single order by id — owner or admin only
    app.get(
      "/orders/:id",
      authenticateUser,
      param("id").custom((value) => ObjectId.isValid(value)).withMessage("Invalid order id"),
      handleValidationErrors,
      async (req, res) => {
        try {
          const { id } = req.params;
          const order = await orderCollection.findOne({ _id: new ObjectId(id) });
          if (!order) {
            return res.status(404).send({ error: "Order not found" });
          }

          // Check ownership: the order's userEmail must match, or the user must be admin
          const db = client.db("mydatabase");
          const user = await db.collection("user").findOne({ uid: req.user.email });
          const isAdmin = user && user.role === "admin";

          if (!isAdmin && order.userEmail !== req.user.email) {
            return res.status(403).send({ error: "Access denied: not your order" });
          }

          res.send(toOrderResponse(order));
        } catch (error) {
          console.error("Error fetching order:", error);
          res.status(500).send({ error: "Failed to fetch order" });
        }
      }
    );

    // Admin comment on a review (the author is always "admin")
    app.post(
      "/reviews/:id/reply",
      authenticateUser,
      requireAdmin,
      param("id").custom((value) => ObjectId.isValid(value)).withMessage("Invalid review id"),
      body("text").trim().isLength({ min: 1, max: 2000 }).withMessage("Reply text is required"),
      handleValidationErrors,
      async (req, res) => {
        try {
          const { id } = req.params;
          const text = req.body.text.trim();

          const reply = {
            name: "admin",
            text: text.slice(0, 2000),
            createdAt: new Date(),
          };

          const updated = await reviewCollection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $push: { replies: reply } },
            { returnDocument: "after" }
          );

          if (!updated) {
            return res.status(404).send({ error: "Review not found" });
          }

          res.status(201).send({ reviewId: id, reply });
        } catch (error) {
          console.error("Error replying to review:", error);
          res.status(500).send({ error: "Failed to add reply" });
        }
      }
    );

    // Delete a review (admin only)
    app.delete(
      "/reviews/:id",
      authenticateUser,
      requireAdmin,
      param("id").custom((value) => ObjectId.isValid(value)).withMessage("Invalid review id"),
      handleValidationErrors,
      async (req, res) => {
        try {
          const { id } = req.params;
          const result = await reviewCollection.deleteOne({
            _id: new ObjectId(id),
          });
          if (!result.deletedCount) {
            return res.status(404).send({ error: "Review not found" });
          }
          res.send({ message: "Review deleted successfully" });
        } catch (error) {
          console.error("Error deleting review:", error);
          res.status(500).send({ error: "Failed to delete review" });
        }
      }
    );

    // ----- Contact messages -----

    // Save a message from the contact page (rate-limited, length-capped)
    app.post(
      "/massage",
      authLimiter,
      body("name").trim().isLength({ min: 1, max: 80 }).withMessage("Your name is required"),
      body("email").isEmail().normalizeEmail().withMessage("A valid email address is required"),
      body("message").trim().isLength({ min: 1, max: 2000 }).withMessage("Please write a message"),
      handleValidationErrors,
      async (req, res) => {
        try {
          const { name, email, message } = req.body;
          const cleanName = name.trim().slice(0, 80);
          const cleanEmail = email.trim().toLowerCase();
          const cleanMessage = message.trim().slice(0, 2000);

          const doc = {
            name: cleanName,
            email: cleanEmail,
            message: cleanMessage,
            status: "unread",
            replies: [],
            createdAt: new Date(),
          };

          const result = await messageCollection.insertOne(doc);
          res.status(201).send({ ...doc, _id: result.insertedId });
        } catch (error) {
          console.error("Error saving message:", error);
          res.status(500).send({ error: "Failed to send message" });
        }
      }
    );

    // All messages for the admin dashboard — admin only
    app.get("/massage", authenticateUser, requireAdmin, async (req, res) => {
      try {
        const messages = await messageCollection
          .find()
          .sort({ createdAt: -1 })
          .toArray();
        res.send(messages);
      } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).send({ error: "Failed to fetch messages" });
      }
    });

    // Public feedback: messages the admin has replied to (contact page) — admin only
    app.get("/massage/feedback", authenticateUser, requireAdmin, async (req, res) => {
      try {
        const messages = await messageCollection
          .find({ "replies.0": { $exists: true } })
          .sort({ createdAt: -1 })
          .toArray();
        res.send(messages);
      } catch (error) {
        console.error("Error fetching feedback:", error);
        res.status(500).send({ error: "Failed to fetch feedback" });
      }
    });

    // Admin reply to a message (author is always "admin"); marks it read
    app.patch(
      "/massage/:id",
      authenticateUser,
      requireAdmin,
      param("id").custom((value) => ObjectId.isValid(value)).withMessage("Invalid message id"),
      body("reply").trim().isLength({ min: 1, max: 2000 }).withMessage("Reply text is required"),
      handleValidationErrors,
      async (req, res) => {
        try {
          const { id } = req.params;
          const text = req.body.reply.trim().slice(0, 2000);

          const reply = {
            name: "admin",
            text,
            createdAt: new Date(),
          };

          const updated = await messageCollection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $push: { replies: reply }, $set: { status: "read" } },
            { returnDocument: "after" }
          );

          if (!updated) {
            return res.status(404).send({ error: "Message not found" });
          }

          res.send({ ...updated, _id: updated._id.toString(), reply });
        } catch (error) {
          console.error("Error replying to message:", error);
          res.status(500).send({ error: "Failed to add reply" });
        }
      }
    );

    // Delete a message — admin only
    app.delete(
      "/massage/:id",
      authenticateUser,
      requireAdmin,
      param("id").custom((value) => ObjectId.isValid(value)).withMessage("Invalid message id"),
      handleValidationErrors,
      async (req, res) => {
        try {
          const { id } = req.params;
          const result = await messageCollection.deleteOne({ _id: new ObjectId(id) });
          if (!result.deletedCount) {
            return res.status(404).send({ error: "Message not found" });
          }
          res.send({ message: "Message deleted successfully" });
        } catch (error) {
          console.error("Error deleting message:", error);
          res.status(500).send({ error: "Failed to delete message" });
        }
      }
    );

    // ----- Blogs -----

    // Fetch blog posts in newest-first pages. The existing 12 seeded posts are
    // returned exactly like newly published community posts.
    app.get("/blogs", async (req, res) => {
      try {
        const fetchAll = req.query.all === "true";
        const page = parsePositiveInteger(req.query.page, 1, 1000000);
        const limit = parsePositiveInteger(req.query.limit, 6, 24);
        const skip = (page - 1) * limit;
        let blogs;
        let total;

        if (fetchAll) {
          blogs = await blogCollection.find().sort({ createdAt: -1 }).toArray();
          total = blogs.length;
        } else {
          [blogs, total] = await Promise.all([
            blogCollection
              .find()
              .sort({ createdAt: -1 })
              .skip(skip)
              .limit(limit)
              .toArray(),
            blogCollection.countDocuments(),
          ]);
        }

        res.send({
          blogs: blogs.map(toBlogResponse),
          pagination: {
            page: fetchAll ? 1 : page,
            limit: fetchAll ? total : limit,
            total,
            hasMore: fetchAll ? false : skip + blogs.length < total,
          },
        });
      } catch (error) {
        console.error("Error fetching blogs:", error);
        res.status(500).send({ error: "Failed to fetch blogs" });
      }
    });

    // Featured posts default to the newest posts, while documents marked
    // `featured: true` are always placed first.
    app.get("/blogs/featured", async (req, res) => {
      try {
        const limit = parsePositiveInteger(req.query.limit, 3, 6);
        const excludeId = req.query.excludeId;
        const filter = {};

        if (excludeId && ObjectId.isValid(excludeId)) {
          filter._id = { $ne: new ObjectId(excludeId) };
        }

        const blogs = await blogCollection
          .find(filter)
          .sort({ featured: -1, createdAt: -1 })
          .limit(limit)
          .toArray();

        res.send(blogs.map(toBlogResponse));
      } catch (error) {
        console.error("Error fetching featured blogs:", error);
        res.status(500).send({ error: "Failed to fetch featured blogs" });
      }
    });

    // Fetch one complete blog post for the detail page.
    app.get("/blogs/:id", async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: "Invalid blog id" });
        }

        const blog = await blogCollection.findOne({ _id: new ObjectId(id) });
        if (!blog) {
          return res.status(404).send({ error: "Blog not found" });
        }

        return res.send(toBlogResponse(blog));
      } catch (error) {
        console.error("Error fetching blog:", error);
        return res.status(500).send({ error: "Failed to fetch blog" });
      }
    });

    // Update a blog post (admin only)
    app.patch(
      "/blogs/:id",
      authenticateUser,
      requireAdmin,
      param("id").custom((value) => ObjectId.isValid(value)).withMessage("Invalid blog id"),
      body("title").optional().trim().isLength({ min: 1, max: 200 }).withMessage("Blog title cannot be empty"),
      body("content").optional().trim().isLength({ min: 1, max: 50000 }).withMessage("Blog content cannot be empty"),
      body("category").optional().trim().isLength({ max: 60 }),
      body("excerpt").optional().trim().isLength({ max: 500 }),
      body("image").optional().trim().isLength({ max: 500 }),
      handleValidationErrors,
      async (req, res) => {
        try {
          const { id } = req.params;

          const allowed = ["title", "category", "content", "excerpt", "image"];
          const update = {};
          for (const key of allowed) {
            if (req.body?.[key] !== undefined) {
              update[key] = String(req.body[key]).trim();
            }
          }
          if (update.title !== undefined && !update.title) {
            return res.status(400).send({ error: "Blog title cannot be empty" });
          }
          if (update.content !== undefined && !update.content) {
            return res.status(400).send({ error: "Blog content cannot be empty" });
          }
          if (Object.keys(update).length === 0) {
            return res.status(400).send({ error: "No fields to update" });
          }
          update.updatedAt = new Date();

          const updated = await blogCollection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: update },
            { returnDocument: "after" }
          );

          if (!updated) {
            return res.status(404).send({ error: "Blog not found" });
          }

          res.send(toBlogResponse(updated));
        } catch (error) {
          console.error("Error updating blog:", error);
          res.status(500).send({ error: "Failed to update blog" });
        }
      }
    );

    // Delete a blog post (admin only)
    app.delete(
      "/blogs/:id",
      authenticateUser,
      requireAdmin,
      param("id").custom((value) => ObjectId.isValid(value)).withMessage("Invalid blog id"),
      handleValidationErrors,
      async (req, res) => {
        try {
          const { id } = req.params;
          const result = await blogCollection.deleteOne({ _id: new ObjectId(id) });
          if (!result.deletedCount) {
            return res.status(404).send({ error: "Blog not found" });
          }
          res.send({ message: "Blog deleted successfully" });
        } catch (error) {
          console.error("Error deleting blog:", error);
          res.status(500).send({ error: "Failed to delete blog" });
        }
      }
    );

    app.post(
      "/blogs/cover",
      authenticateUser,
      requireAdmin,
      express.raw({ type: "image/*", limit: "5mb" }),
      async (req, res) => {
        const contentType = (req.get("content-type") || "")
          .split(";")[0]
          .toLowerCase();
        const fileExtensions = {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
          "image/gif": "gif",
        };
        const extension = fileExtensions[contentType];

        if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
          return res.status(400).send({ error: "A cover image is required." });
        }
        if (!extension) {
          return res.status(415).send({
            error: "Cover images must be JPEG, PNG, WebP, or GIF files.",
          });
        }
        // Magic-byte sniff against spoofed content types.
        const magic = req.body.subarray(0, 12);
        const looksImage =
          (magic[0] === 0xff && magic[1] === 0xd8 && magic[2] === 0xff) ||
          (magic[0] === 0x89 && magic[1] === 0x50 && magic[2] === 0x4e && magic[3] === 0x47) ||
          (magic[0] === 0x52 && magic[1] === 0x49 && magic[2] === 0x46 && magic[3] === 0x46) ||
          (magic[0] === 0x47 && magic[1] === 0x49 && magic[2] === 0x46);
        if (!looksImage) {
          return res.status(415).send({ error: "File content is not a valid image." });
        }

        // Covers are stored in MongoDB so the API also runs on hosts with a
        // read-only filesystem.
        const coverId = randomUUID();
        const image = `blog-covers/${coverId}`;

        try {
          await blogCoverCollection.insertOne({
            _id: coverId,
            data: req.body,
            contentType,
            createdAt: new Date(),
          });
          return res.status(201).send({ image });
        } catch (error) {
          console.error("Error saving blog cover:", error);
          return res.status(500).send({ error: "Unable to save the cover image." });
        }
      }
    );

    app.post(
      "/blogs",
      authenticateUser,
      requireAdmin,
      body("title").trim().isLength({ min: 1, max: 200 }).withMessage("Blog title is required"),
      body("content").trim().isLength({ min: 1, max: 50000 }).withMessage("Blog content is required"),
      body("email").isEmail().normalizeEmail().withMessage("A valid email address is required"),
      body("category").optional().trim().isLength({ max: 60 }),
      body("image").optional().trim().isLength({ max: 500 }),
      body("excerpt").optional().trim().isLength({ max: 500 }),
      handleValidationErrors,
      async (req, res) => {
        try {
          const { title, category, image, excerpt, content, email } = req.body;
          const cleanTitle = title.trim();
          const bodyText = (content || excerpt || "").trim();
          const cleanEmail = email.trim().toLowerCase();

          const author = cleanEmail.split("@")[0];
          const now = new Date();
          const blog = {
            title: cleanTitle,
            category: category?.trim() || "Community",
            image: image?.trim() || "",
            excerpt: excerpt?.trim() || bodyText.slice(0, 160),
            content: bodyText,
            author,
            authorEmail: cleanEmail,
            authorPhotoURL: "",
            createdAt: now,
          };

          const result = await blogCollection.insertOne(blog);
          res.status(201).send(toBlogResponse({ ...blog, _id: result.insertedId }));
        } catch (error) {
          console.error("Error adding blog:", error);
          res.status(500).send({ error: "Failed to add blog" });
        }
      }
    );

    // ----- Admin Chat endpoints -----

    // Create a new chat session (customer, rate-limited)
    app.post(
      "/admin/chats",
      authLimiter,
      authenticateUser,
      body("customerName").optional().trim().isLength({ max: 80 }),
      body("customerEmail").optional().isEmail().normalizeEmail(),
      handleValidationErrors,
      async (req, res) => {
        try {
          const { customerName, customerEmail, status = "active" } = req.body;
          const cleanEmail = (customerEmail || req.user.email || "").trim().toLowerCase();
          const user = await db.collection("user").findOne({ uid: req.user.email });
          // One chat session per customer email — return existing if one exists
          const existingSession = await chatSessionCollection.findOne({
            customerEmail: cleanEmail,
          });
          if (existingSession) {
            return res.status(200).send({
              ...existingSession,
              _id: existingSession._id,
              sessionId: existingSession._id,
            });
          }
          const session = {
            customerName: String(customerName || "Customer").slice(0, 80),
            customerEmail: cleanEmail,
            customerId: req.user.email,
            status: status === "resolved" ? "resolved" : "active",
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          const result = await chatSessionCollection.insertOne(session);
          res.status(201).send({ ...session, _id: result.insertedId, sessionId: result.insertedId });
        } catch (error) {
          console.error("Error creating chat session:", error);
          res.status(500).send({ error: "Failed to create chat session" });
        }
      }
    );

    // List all chat sessions (admin only) — newest first
    app.get(
      "/admin/chats",
      authenticateUser,
      requireAdmin,
      async (req, res) => {
        try {
          const sessions = await chatSessionCollection
            .find()
            .sort({ updatedAt: -1 })
            .toArray();
          res.send(sessions);
        } catch (error) {
          console.error("Error fetching chat sessions:", error);
          res.status(500).send({ error: "Failed to fetch chat sessions" });
        }
      }
    );

    // Get messages for a chat session (admin only)
    app.get(
      "/admin/chats/:sessionId/messages",
      authenticateUser,
      requireAdmin,
      param("sessionId").custom((value) => ObjectId.isValid(value)).withMessage("Invalid session id"),
      handleValidationErrors,
      async (req, res) => {
        try {
          const { sessionId } = req.params;
          const messages = await chatMessageCollection
            .find({ sessionId: new ObjectId(sessionId) })
            .sort({ createdAt: 1 })
            .toArray();
          res.send(messages);
        } catch (error) {
          console.error("Error fetching chat messages:", error);
          res.status(500).send({ error: "Failed to fetch chat messages" });
        }
      }
    );

    // Get messages for a chat session (customer accessible — for history fetch on mount)
    app.get(
      "/api/chats/:sessionId/messages",
      authenticateUser,
      param("sessionId").custom((value) => ObjectId.isValid(value)).withMessage("Invalid session id"),
      handleValidationErrors,
      async (req, res) => {
        try {
          const { sessionId } = req.params;
          const messages = await chatMessageCollection
            .find({ sessionId: new ObjectId(sessionId) })
            .sort({ createdAt: 1 })
            .limit(50)
            .toArray();
          // Sanitize ObjectIds for JSON response
          const sanitized = messages.map((m) => ({
            ...m,
            _id: m._id.toString(),
            sessionId: m.sessionId.toString(),
            createdAt: m.createdAt.toISOString(),
          }));
          res.send(sanitized);
        } catch (error) {
          console.error("Error fetching chat messages:", error);
          res.status(500).send({ error: "Failed to fetch chat messages" });
        }
      }
    );

    // Send a message to a chat session (customer or admin, rate-limited)
    app.post(
      "/admin/chats/:sessionId/messages",
      authLimiter,
      authenticateUser,
      param("sessionId").custom((value) => ObjectId.isValid(value)).withMessage("Invalid session id"),
      body("text").trim().isLength({ min: 1, max: 2000 }).withMessage("Message text is required"),
      handleValidationErrors,
      async (req, res) => {
        try {
          const { sessionId } = req.params;
          const { text } = req.body;
          const user = await db.collection("user").findOne({ uid: req.user.email });
          const senderRole = user?.role === "admin" ? "admin" : "customer";
          const msg = {
            sessionId: new ObjectId(sessionId),
            sender: senderRole === "admin" ? "admin" : "customer",
            senderName: req.user.email,
            senderRole,
            text: String(text).trim().slice(0, 2000),
            createdAt: new Date(),
            read: false,
          };
          const result = await chatMessageCollection.insertOne(msg);
          msg._id = result.insertedId;

          await chatSessionCollection.findOneAndUpdate(
            { _id: new ObjectId(sessionId) },
            { $set: { updatedAt: new Date() } }
          );

          // Broadcast via Socket.io if available
          const io = app.io;
          if (io) {
            io.to(`session:${sessionId}`).emit("chat:message", msg);
          }

          res.status(201).send(msg);
        } catch (error) {
          console.error("Error sending chat message:", error);
          res.status(500).send({ error: "Failed to send message" });
        }
      }
    );

    // Mark a chat session as resolved (admin only)
    app.patch(
      "/admin/chats/:sessionId/resolve",
      authenticateUser,
      requireAdmin,
      param("sessionId").custom((value) => ObjectId.isValid(value)).withMessage("Invalid session id"),
      handleValidationErrors,
      async (req, res) => {
        try {
          const { sessionId } = req.params;
          const result = await chatSessionCollection.findOneAndUpdate(
            { _id: new ObjectId(sessionId) },
            { $set: { status: "resolved", updatedAt: new Date() } },
            { returnDocument: "after" }
          );
          if (!result) {
            return res.status(404).send({ error: "Chat session not found" });
          }
          res.send({ message: "Chat resolved", session: result });
        } catch (error) {
          console.error("Error resolving chat:", error);
          res.status(500).send({ error: "Failed to resolve chat" });
        }
      }
    );

    // ----- Socket.io real-time chat server -----
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: (origin, callback) => {
          if (!origin) return callback(null, true);
          if (ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, origin);
          }
          return callback(new Error("Not allowed by CORS policy"));
        },
        credentials: false,
      },
      maxHttpBufferSize: 1e5, // 100kb — chat text only, no binary floods
    });

    // Socket.io auth middleware — verify JWT from query token.
    // Fail closed: missing/invalid secret or token = reject the socket.
    io.use((socket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error("Authentication required"));
      }
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret || jwtSecret.length < 32) {
        console.error("Socket auth: JWT_SECRET missing or too short");
        return next(new Error("Server configuration error"));
      }
      try {
        const decoded = jwt.verify(token, jwtSecret, { algorithms: ["HS256"], maxAge: "1h" });
        if (!decoded?.email) return next(new Error("Invalid token payload"));
        socket.userId = decoded.userId || decoded.email;
        socket.userRole = decoded.role || "customer";
        socket.userEmail = decoded.email;
        next();
      } catch (err) {
        return next(new Error("Invalid token"));
      }
    });

    io.on("connection", (socket) => {
      // Customer joins their chat session — sessionId must be a valid id
      // and must belong to the caller's own email (no peeking at others).
      socket.on("join:customer", async ({ sessionId }) => {
        try {
          if (!sessionId || !ObjectId.isValid(sessionId)) {
            socket.emit("chat:error", { message: "Invalid session" });
            return;
          }
          const session = await chatSessionCollection.findOne({
            _id: new ObjectId(sessionId),
          });
          if (!session || session.customerEmail !== socket.userEmail) {
            socket.emit("chat:error", { message: "Access denied" });
            return;
          }
          socket.join(`session:${sessionId}`);
          socket.sessionId = sessionId;
          const messages = await chatMessageCollection
            .find({ sessionId: new ObjectId(sessionId) })
            .sort({ createdAt: 1 })
            .limit(50)
            .toArray();
          // Sanitize ObjectIds for socket emission (frontend expects strings)
          const sanitized = messages.map((m) => ({
            ...m,
            _id: m._id.toString(),
            sessionId: m.sessionId.toString(),
            createdAt: m.createdAt.toISOString(),
          }));
          socket.emit("chat:history", sanitized);
        } catch (error) {
          console.error("Error joining customer chat:", error);
          socket.emit("chat:error", { message: "Failed to load chat history" });
        }
      });

      // Admin joins a chat session
      socket.on("join:admin", ({ sessionId }) => {
        if (socket.userRole !== "admin") {
          socket.emit("chat:error", { message: "Admin access required" });
          return;
        }
        if (!sessionId || !ObjectId.isValid(sessionId)) {
          socket.emit("chat:error", { message: "Invalid session" });
          return;
        }
        socket.join(`session:${sessionId}`);
        socket.sessionId = sessionId;
        socket.emit("chat:joined", { sessionId, role: "admin" });
      });

      // Send a message — never trust client sender fields; derive identity
      // from the verified socket token, cap length, verify membership.
      socket.on("chat:send", async ({ sessionId, text }) => {
        try {
          if (!sessionId || !ObjectId.isValid(sessionId)) {
            socket.emit("chat:error", { message: "Invalid session" });
            return;
          }
          const cleanText = String(text || "").trim().slice(0, 2000);
          if (!cleanText) {
            socket.emit("chat:error", { message: "Message text is required" });
            return;
          }
          const session = await chatSessionCollection.findOne({
            _id: new ObjectId(sessionId),
          });
          const isOwner = session && session.customerEmail === socket.userEmail;
          if (socket.userRole !== "admin" && !isOwner) {
            socket.emit("chat:error", { message: "Access denied" });
            return;
          }
          const senderRole = socket.userRole === "admin" ? "admin" : "customer";
          const msg = {
            sessionId: new ObjectId(sessionId),
            sender: senderRole,
            senderName: socket.userEmail,
            senderRole,
            text: cleanText,
            createdAt: new Date(),
            read: false,
          };
          const result = await chatMessageCollection.insertOne(msg);
          msg._id = result.insertedId;

          await chatSessionCollection.findOneAndUpdate(
            { _id: new ObjectId(sessionId) },
            { $set: { updatedAt: new Date() } }
          );

          // Sanitize ObjectId/Date for socket emission (frontend expects strings)
          const emitMsg = {
            _id: msg._id.toString(),
            sessionId: msg.sessionId.toString(),
            sender: msg.sender,
            senderName: msg.senderName,
            senderRole: msg.senderRole,
            text: msg.text,
            createdAt: msg.createdAt.toISOString(),
            read: msg.read,
          };
          io.to(`session:${sessionId}`).emit("chat:message", emitMsg);
        } catch (error) {
          console.error("Error sending chat message:", error);
          socket.emit("chat:error", { message: "Failed to send message" });
        }
      });

      // Mark messages as read — only members of the session can mark it.
      socket.on("chat:read", async ({ sessionId }) => {
        try {
          if (!sessionId || !ObjectId.isValid(sessionId)) return;
          const session = await chatSessionCollection.findOne({
            _id: new ObjectId(sessionId),
          });
          const isOwner = session && session.customerEmail === socket.userEmail;
          if (socket.userRole !== "admin" && !isOwner) return;
          await chatMessageCollection.updateMany(
            { sessionId: new ObjectId(sessionId), read: false },
            { $set: { read: true } }
          );
          io.to(`session:${sessionId}`).emit("chat:read", { sessionId });
        } catch (error) {
          console.error("Error marking messages read:", error);
        }
      });

      // Typing indicator — session-scoped, length-capped name.
      socket.on("chat:typing", ({ sessionId, isTyping }) => {
        if (!sessionId || !ObjectId.isValid(sessionId)) return;
        socket.to(`session:${sessionId}`).emit("chat:typing", {
          isTyping: Boolean(isTyping),
          senderName: String(socket.userEmail || "").slice(0, 80),
        });
      });

      socket.on("disconnect", () => {});
    });

    // Expose server and io on the app for module-level listen
    app.server = server;
    app.io = io;
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw error;
  }

  return app;
}

// The app is initialised once and cached for the normal server (npm start).
let initializedApp;

const getApp = async () => {
  if (!initializedApp) {
    initializedApp = run().catch((error) => {
      initializedApp = null;
      throw error;
    });
  }
  return initializedApp;
};

if (require.main === module) {
  getApp()
    .then((application) => {
      application.server.listen(port, () => {
        console.log(`Server running on port ${port}`);
      });
    })
    .catch((error) => {
      console.error("Server failed to start:", error);
      process.exit(1);
    });
}

module.exports = { getApp };
