
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

    await Promise.all([
      blogCollection.createIndex({ createdAt: -1 }),
      blogCollection.createIndex({ featured: -1, createdAt: -1 }),
      userCollection.createIndex({ uid: 1 }, { unique: true }),
    ]);

    console.log("MongoDB connected successfully!");

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
        res.send(products.map(withImageUrl));
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
        res.send(withImageUrl(product));
      } catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).send({ error: "Failed to fetch product" });
      }
    });

    // ----- Reviews -----

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
