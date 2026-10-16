
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





const app = express();
const port = process.env.PORT || 5000;

// Admin emails — users with these emails get role "admin" on first login.
// Set ADMIN_EMAILS in .env (comma-separated) to override the default.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "musfikurr93@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// ---- Security middleware (from the Website Security Guide) ----

// 1. Helmet: sets security-related HTTP headers
app.use(helmet());

// 2. CORS: allow the trusted frontend origin plus localhost for development
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "https://coffee-mern.netlify.app";
const ALLOWED_ORIGINS = [
  FRONTEND_ORIGIN,
  "https://resplendent-begonia-d8c942.netlify.app",
  "https://coffee-mern.netlify.app",
  "https://coffee-mern.onrender.com",
  "http://localhost:5173",
  "http://localhost:5174",
];
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser requests (curl, etc.)
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, origin);
    }
    return callback(new Error("Not allowed by CORS policy"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));

// 3. Limit JSON body size to prevent large payload attacks
app.use(express.json({ limit: "20kb" }));

// 4. Rate limiting for all API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 500,               // max 500 requests per window
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
// Apply rate limiting to all routes (frontend calls routes without /api prefix)
app.use(apiLimiter);

// Stricter limit for auth-sensitive endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many authentication attempts, please try again later." },
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
const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = authHeader.slice(7);
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return res.status(500).json({ message: "Server configuration error" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = { email: decoded.email, role: decoded.role };
    console.log("Auth: token verified for", decoded.email);
    next();
  } catch (error) {
    console.error("Auth: JWT verification failed:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
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

    // Uptime/readiness check used by hosting providers (Render, Railway, …)
    app.get("/health", (req, res) => {
      res.send({ status: "ok", uptime: process.uptime() });
    });

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

    app.get("/", (req, res) => {
      res.send("Server is running!");
    });

        //jwt token generation api — issues a JWT only after the email is
    //verified against the users collection (never trust the client).
app.post(
  "/jwt",
  authLimiter,
  body("email").isEmail().normalizeEmail(),
  handleValidationErrors,
  async (req, res) => {
    const jwtSecret = process.env.JWT_SECRET;
    const email = req.body.email.toLowerCase();

    if (!jwtSecret) {
      console.error("JWT_SECRET is missing from .env");
      return res.status(500).json({ error: "JWT secret is not configured" });
    }

    try {
      await client.connect();

      const db = client.db("mydatabase");
      const userCollection = db.collection("user");

      let user = await userCollection.findOne({ uid: email });
      const isAdminEmail = ADMIN_EMAILS.includes(email);

      if (!user) {
        const newUser = {
          uid: email,
          email,
          role: isAdminEmail ? "admin" : "customer",
          createdAt: new Date(),
        };

        const result = await userCollection.insertOne(newUser);
        user = { _id: result.insertedId, ...newUser };
      } else if (isAdminEmail && user.role !== "admin") {
        await userCollection.updateOne(
          { _id: user._id },
          { $set: { role: "admin" } }
        );
        user.role = "admin";
      }

      const token = jwt.sign(
        {
          userId: user._id.toString(),
          email: user.email,
          role: user.role,
        },
        jwtSecret,
        { expiresIn: "1h" }
      );

      return res.status(200).json({ token });
    } catch (error) {
      console.error("JWT generation error:", error);
      return res.status(500).json({ error: "Failed to generate token" });
    }
  }
);   // hosts with a read-only or ephemeral filesystem, e.g. Render free tier)
    app.post(
      "/products/image",
      authenticateUser,
      requireAdmin,
      express.raw({ type: "image/*", limit: "100mb" }),
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

    app.post(
      "/products",
      authenticateUser,
      requireAdmin,
      body("name").trim().notEmpty().withMessage("Name is required"),
      body("price").isNumeric().withMessage("Price must be a number"),
      handleValidationErrors,
      async (req, res) => {
        try {
          const product = req.body;
          // Support both a single product and an array (bulk seed)
          if (Array.isArray(product)) {
            const result = await productCollection.insertMany(product);
            return res
              .status(201)
              .send({ message: "Products inserted", count: result.insertedCount });
          }
          const result = await productCollection.insertOne(product);
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
      body("price").optional().isNumeric().withMessage("Price must be a number"),
      handleValidationErrors,
      async (req, res) => {
        try {
          const { id } = req.params;

          const allowed = ["name", "price", "category", "description", "image", "badge", "weight", "rating"];
          const update = {};
          for (const key of allowed) {
            if (req.body?.[key] !== undefined) {
              update[key] = key === "price" ? Number(req.body[key]) : req.body[key];
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

    // Add a review for a product (authenticated users only)
    app.post(
      "/reviews",
      authenticateUser,
      body("productId").trim().notEmpty().withMessage("productId is required"),
      body("rating").isInt({ min: 1, max: 5 }).withMessage("rating must be between 1 and 5"),
      body("name").optional().trim().escape(),
      body("comment").optional().trim().escape(),
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

    const getDeliveryPrices = async () => {
      const settings = await settingsCollection.findOne({});
      return { ...DEFAULT_DELIVERY_PRICES, ...(settings?.deliveryPrices || {}) };
    };

    // Public settings for the storefront (store info + delivery prices)
    app.get("/settings", async (req, res) => {
      try {
        const settings = await settingsCollection.findOne({});
        // Only expose safe, storefront-relevant fields
        const safeSettings = {
          storeName: settings?.storeName || DEFAULT_SETTINGS.storeName,
          supportEmail: settings?.supportEmail || DEFAULT_SETTINGS.supportEmail,
          phone: settings?.phone || DEFAULT_SETTINGS.phone,
          address: settings?.address || DEFAULT_SETTINGS.address,
          deliveryPrices: settings?.deliveryPrices || DEFAULT_SETTINGS.deliveryPrices,
        };
        res.send(safeSettings);
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
      body("storeName").optional().trim().notEmpty().withMessage("Store name cannot be empty"),
      body("supportEmail").optional().isEmail().normalizeEmail(),
      body("phone").optional().trim().notEmpty(),
      body("address").optional().trim().notEmpty(),
      body("deliveryPrices").optional().isObject(),
      handleValidationErrors,
      async (req, res) => {
        try {
          const body = req.body || {};
          const update = {};

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

          const existing = await settingsCollection.findOne({});
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

          res.send({ ...DEFAULT_SETTINGS, ...saved });
        } catch (error) {
          console.error("Error updating settings:", error);
          res.status(500).send({ error: "Failed to update settings" });
        }
      }
    );

    // ----- Orders -----

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
        if (!item?.name || typeof item.name !== "string") {
          return { error: "Each order item needs a product name" };
        }
        if (!Number.isFinite(Number(item.price)) || Number(item.price) < 0) {
          return { error: "Each order item needs a valid price" };
        }
        if (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1) {
          return { error: "Each order item quantity must be at least 1" };
        }
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

      if (!address?.street || !address?.city || !address?.zip || !address?.country) {
        return { error: "A complete shipping address is required" };
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

    // Place an order after checkout details + payment method are collected
    app.post(
      "/orders",
      authenticateUser,
      body("items").isArray({ min: 1 }).withMessage("Order items are required"),
      body("customer.firstName").trim().notEmpty().withMessage("First name is required"),
      body("customer.lastName").trim().notEmpty().withMessage("Last name is required"),
      body("customer.email").isEmail().normalizeEmail().withMessage("Valid email is required"),
      body("customer.phone").trim().notEmpty().withMessage("Phone is required"),
      body("address.street").trim().notEmpty().withMessage("Street is required"),
      body("address.city").trim().notEmpty().withMessage("City is required"),
      body("address.zip").trim().notEmpty().withMessage("Zip is required"),
      body("address.country").trim().notEmpty().withMessage("Country is required"),
      body("deliveryMethod").isIn(["standard", "express"]).withMessage("Invalid delivery method"),
      body("payment.method").isIn(["card", "cod"]).withMessage("Invalid payment method"),
      handleValidationErrors,
      async (req, res) => {
        try {
          const { error, order } = await buildOrderFromRequest(req.body);
          if (error) {
            return res.status(400).send({ error });
          }

          // Server-side price verification: never trust frontend-calculated totals.
          // Look up each product in the database and verify the price matches.
          for (const item of order.items) {
            if (!item.productId) continue;
            try {
              const product = await productCollection.findOne({ _id: new ObjectId(item.productId) });
              if (!product) {
                return res.status(400).send({ error: `Product not found: ${item.name}` });
              }
              const dbPrice = Number(product.price);
              const frontendPrice = Number(item.price);
              if (Math.abs(dbPrice - frontendPrice) > 0.01) {
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

          // Record the authenticated user's email as the order owner
          order.userEmail = req.user.email;

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
      body("text").trim().notEmpty().withMessage("Reply text is required"),
      handleValidationErrors,
      async (req, res) => {
        try {
          const { id } = req.params;
          const text = req.body.text.trim();

          const reply = {
            name: "admin",
            text,
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

    // Save a message from the contact page
    app.post(
      "/massage",
      authLimiter,
      body("name").trim().notEmpty().withMessage("Your name is required"),
      body("email").isEmail().normalizeEmail().withMessage("A valid email address is required"),
      body("message").trim().notEmpty().withMessage("Please write a message"),
      handleValidationErrors,
      async (req, res) => {
        try {
          const { name, email, message } = req.body;
          const cleanName = name.trim();
          const cleanEmail = email.trim().toLowerCase();
          const cleanMessage = message.trim();

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
      body("reply").trim().notEmpty().withMessage("Reply text is required"),
      handleValidationErrors,
      async (req, res) => {
        try {
          const { id } = req.params;
          const text = req.body.reply.trim();

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
      body("title").optional().trim().notEmpty().withMessage("Blog title cannot be empty"),
      body("content").optional().trim().notEmpty().withMessage("Blog content cannot be empty"),
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
      express.raw({ type: "image/*", limit: "100mb" }),
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

        // Covers are stored in MongoDB so the API also runs on hosts with a
        // read-only filesystem (Netlify Functions, for example).
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
      body("title").trim().notEmpty().withMessage("Blog title is required"),
      body("content").trim().notEmpty().withMessage("Blog content is required"),
      body("email").isEmail().normalizeEmail().withMessage("A valid email address is required"),
      body("category").optional().trim().escape(),
      body("image").optional().trim().escape(),
      body("excerpt").optional().trim().escape(),
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

    // Create a new chat session (customer)
    app.post(
      "/admin/chats",
      authenticateUser,
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
            customerName: customerName || "Customer",
            customerEmail: cleanEmail,
            customerId: req.user.email,
            status,
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

    // Send a message to a chat session (customer or admin)
    app.post(
      "/admin/chats/:sessionId/messages",
      authenticateUser,
      param("sessionId").custom((value) => ObjectId.isValid(value)).withMessage("Invalid session id"),
      body("text").trim().notEmpty().withMessage("Message text is required"),
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
            text,
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
        credentials: true,
      },
    });

    // Socket.io auth middleware — verify JWT from query token
    io.use((socket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error("Authentication required"));
      }
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
        socket.userId = decoded.uid || decoded.userId || decoded.email;
        socket.userRole = decoded.role || "customer";
        socket.userEmail = decoded.email;
        next();
      } catch (err) {
        return next(new Error("Invalid token"));
      }
    });

    io.on("connection", (socket) => {
      console.log("Socket connected:", socket.id, "role:", socket.userRole);

      // Customer joins their chat session
      socket.on("join:customer", async ({ sessionId }) => {
        try {
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
        socket.join(`session:${sessionId}`);
        socket.sessionId = sessionId;
        socket.emit("chat:joined", { sessionId, role: "admin" });
      });

      // Send a message
      socket.on("chat:send", async ({ sessionId, text, sender, senderName, senderRole }) => {
        try {
          const msg = {
            sessionId: new ObjectId(sessionId),
            sender,
            senderName,
            senderRole,
            text,
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

      // Mark messages as read
      socket.on("chat:read", async ({ sessionId }) => {
        try {
          await chatMessageCollection.updateMany(
            { sessionId: new ObjectId(sessionId), read: false },
            { $set: { read: true } }
          );
          io.to(`session:${sessionId}`).emit("chat:read", { sessionId });
        } catch (error) {
          console.error("Error marking messages read:", error);
        }
      });

      // Typing indicator
      socket.on("chat:typing", ({ sessionId, isTyping, senderName }) => {
        socket.to(`session:${sessionId}`).emit("chat:typing", { isTyping, senderName });
      });

      socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
      });
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

// The app is initialised once and cached, so it works both as a normal
// server (npm start) and as a Netlify Function (see netlify/functions/api.js).
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
