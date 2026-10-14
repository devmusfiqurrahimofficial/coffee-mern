
const express = require("express");
const cors = require("cors");
const { randomUUID } = require("crypto");
const fs = require("fs/promises");
const { MongoClient, ObjectId } = require("mongodb");
const path = require("path");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());


app.use("/images", express.static(path.join(__dirname, "images")));

// Public base URL used to turn stored image filenames into full URLs.
// Set BASE_URL in .env when you deploy (e.g. https://api.yoursite.com).
const BASE_URL = process.env.BASE_URL || `http://localhost:${port}`;

// The DB stores just the filename (e.g. "sandwich.jpg"); convert it to a full URL.
// If a value already looks like a URL, leave it untouched.
const toImageUrl = (image) => {
  if (!image) return image;
  if (/^(https?:)?\/\//i.test(image)) return image;
  return `${BASE_URL}/images/${image}`;
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

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is not configured");
}
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();

    const db = client.db("mydatabase");
    const productCollection = db.collection("products");
    const reviewCollection = db.collection("reviews");
    const blogCollection = db.collection("blogs");
    const userCollection = db.collection("user");
    const orderCollection = db.collection("orders");
    const settingsCollection = db.collection("settings");
    const messageCollection = db.collection("messages");

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

    app.get("/", (req, res) => {
      res.send("Server is running!");
    });

        //jwt token generation api
app.post("/jwt", (req, res) => {
  const { email } = req.body;
  const jwtSecret = process.env.JWT_SECRET;

  if (!email) return res.status(400).send({ error: "Email is required" });
  if (!jwtSecret) {
    console.error("JWT_SECRET is missing from .env");
    return res.status(500).send({ error: "JWT secret is not configured" });
  }

  try {
    const token = jwt.sign({ email }, jwtSecret, { expiresIn: "1h" });
    res.send({ token });
  } catch (error) {
    console.error("JWT sign error:", error);
    res.status(500).send({ error: "Failed to generate token" });
  }
});
    app.post("/products", async (req, res) => {
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
    });

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
    app.patch("/products/:id", async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: "Invalid product id" });
        }

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
    });

    // Delete a product
    app.delete("/products/:id", async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: "Invalid product id" });
        }
        const result = await productCollection.deleteOne({ _id: new ObjectId(id) });
        if (!result.deletedCount) {
          return res.status(404).send({ error: "Product not found" });
        }
        res.send({ message: "Product deleted successfully" });
      } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).send({ error: "Failed to delete product" });
      }
    });

    // ----- Reviews -----

    // Get all reviews across all products (for the admin dashboard)
    app.get("/reviews", async (req, res) => {
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

    // Add a review for a product
    app.post("/reviews", async (req, res) => {
      try {
        const { productId, name, rating, comment } = req.body;

        // Basic validation
        if (!productId) {
          return res.status(400).send({ error: "productId is required" });
        }
        const numericRating = Number(rating);
        if (!numericRating || numericRating < 1 || numericRating > 5) {
          return res.status(400).send({ error: "rating must be between 1 and 5" });
        }

        const review = {
          productId,
          name: name?.trim() || "Anonymous",
          rating: numericRating,
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
        res.send({ ...DEFAULT_SETTINGS, ...(settings || {}) });
      } catch (error) {
        console.error("Error fetching settings:", error);
        res.status(500).send({ error: "Failed to fetch settings" });
      }
    });

    // Admin updates store settings
    app.put("/settings", async (req, res) => {
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
    });

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
    app.post("/orders", async (req, res) => {
      try {
        const { error, order } = await buildOrderFromRequest(req.body);
        if (error) {
          return res.status(400).send({ error });
        }

        const result = await orderCollection.insertOne(order);
        res.status(201).send(toOrderResponse({ ...order, _id: result.insertedId }));
      } catch (error) {
        console.error("Error placing order:", error);
        res.status(500).send({ error: "Failed to place order" });
      }
    });

    // List orders (optionally filtered by status and/or customer email) — newest first
    app.get("/orders", async (req, res) => {
      try {
        const filter = {};
        if (req.query.status) {
          if (!ALLOWED_ORDER_STATUSES.includes(req.query.status)) {
            return res.status(400).send({ error: "Invalid order status" });
          }
          filter.status = req.query.status;
        }
        if (req.query.email) {
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

    // Update an order's status (accept / reject / out for delivery / delivered)
    app.patch("/orders/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { status } = req.body;

        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: "Invalid order id" });
        }
        if (!ALLOWED_ORDER_STATUSES.includes(status)) {
          return res.status(400).send({ error: "Invalid order status" });
        }

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
    });

    // Fetch a single order by id
    app.get("/orders/:id", async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: "Invalid order id" });
        }
        const order = await orderCollection.findOne({ _id: new ObjectId(id) });
        if (!order) {
          return res.status(404).send({ error: "Order not found" });
        }
        res.send(toOrderResponse(order));
      } catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).send({ error: "Failed to fetch order" });
      }
    });

    // Admin comment on a review (the author is always "admin")
    app.post("/reviews/:id/reply", async (req, res) => {
      try {
        const { id } = req.params;
        const text = req.body?.text?.trim();

        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: "Invalid review id" });
        }
        if (!text) {
          return res.status(400).send({ error: "Reply text is required" });
        }

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
    });

    // ----- Contact messages -----

    // Save a message from the contact page
    app.post("/massage", async (req, res) => {
      try {
        const { name, email, message } = req.body;
        const cleanName = name?.trim();
        const cleanEmail = email?.trim().toLowerCase();
        const cleanMessage = message?.trim();

        if (!cleanName) {
          return res.status(400).send({ error: "Your name is required" });
        }
        if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
          return res.status(400).send({ error: "A valid email address is required" });
        }
        if (!cleanMessage) {
          return res.status(400).send({ error: "Please write a message" });
        }

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
    });

    // All messages for the admin dashboard
    app.get("/massage", async (req, res) => {
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

    // Public feedback: messages the admin has replied to (contact page)
    app.get("/massage/feedback", async (req, res) => {
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
    app.patch("/massage/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const text = req.body?.reply?.trim();

        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: "Invalid message id" });
        }
        if (!text) {
          return res.status(400).send({ error: "Reply text is required" });
        }

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
    });

    // Delete a message
    app.delete("/massage/:id", async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: "Invalid message id" });
        }
        const result = await messageCollection.deleteOne({ _id: new ObjectId(id) });
        if (!result.deletedCount) {
          return res.status(404).send({ error: "Message not found" });
        }
        res.send({ message: "Message deleted successfully" });
      } catch (error) {
        console.error("Error deleting message:", error);
        res.status(500).send({ error: "Failed to delete message" });
      }
    });

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

    // Update a blog post
    app.patch("/blogs/:id", async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: "Invalid blog id" });
        }

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
    });

    // Delete a blog post
    app.delete("/blogs/:id", async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: "Invalid blog id" });
        }
        const result = await blogCollection.deleteOne({ _id: new ObjectId(id) });
        if (!result.deletedCount) {
          return res.status(404).send({ error: "Blog not found" });
        }
        res.send({ message: "Blog deleted successfully" });
      } catch (error) {
        console.error("Error deleting blog:", error);
        res.status(500).send({ error: "Failed to delete blog" });
      }
    });

    app.post(
      "/blogs/cover",
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

        const image = `blog-covers/${randomUUID()}.${extension}`;
        const imageDirectory = path.join(__dirname, "images", "blog-covers");

        try {
          await fs.mkdir(imageDirectory, { recursive: true });
          await fs.writeFile(path.join(imageDirectory, path.basename(image)), req.body);
          return res.status(201).send({ image });
        } catch (error) {
          console.error("Error saving blog cover:", error);
          return res.status(500).send({ error: "Unable to save the cover image." });
        }
      }
    );

    app.post("/blogs", async (req, res) => {
      try {
        const { title, category, image, excerpt, content, email } = req.body;
        const cleanTitle = title?.trim();
        const body = (content || excerpt || "").trim();
        const cleanEmail = email?.trim().toLowerCase();

        if (!cleanTitle) {
          return res.status(400).send({ error: "Blog title is required" });
        }
        if (!body) {
          return res.status(400).send({ error: "Blog content is required" });
        }
        if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
          return res.status(400).send({ error: "A valid email address is required" });
        }

        const author = cleanEmail.split("@")[0];
        const now = new Date();
        const blog = {
          title: cleanTitle,
          category: category?.trim() || "Community",
          image: image?.trim() || "",
          excerpt: excerpt?.trim() || body.slice(0, 160),
          content: body,
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
    });

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error);
  }
}

run();
