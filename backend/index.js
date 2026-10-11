const express = require('express');
const cors = require('cors');
const app = express();
const port=process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://devmusfiqurrahimofficial_db_user:PmTfd!YAa7!a85s@cluster0.yxajely.mongodb.net/?appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri,  {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");


    //product collection
    const productCollection = client.db("productDB").collection("products");

    app.post("/products", async (req, res) => {
      try {
        const product = req.body;
        const result = await productCollection.insertOne(product);
       res.status(201).send({ message: "Product inserted successfully", productId: result.insertedId });
      }
      catch (error) {
        console.error("Error inserting product:", error);
        res.status(500).send({ error: "Failed to insert product" });
      }
    });
    app.get("/products", async (req, res) => {
    try {
       const query = {};
     const cursor = productCollection.find(query);
     const products = await cursor.toArray();
     res.send(products);}
    catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).send({ error: "Failed to fetch products" });
      }
}
)

//product update api

app.patch("/products/:id", async (req, res) => {
  try{
    const productId = req.params.id;
    const filter = { _id: new ObjectId(productId) };
    const options = { upsert: true };
    const updatedProduct = req.body;
    const updateDoc = {
      $set: {
        name:data.name,
        price:data.price,
        description:data.description,
        stock:data.quantity,
        image:data.image,
      }
    }
    const result = await productCollection.updateOne(filter, updateDoc, options);
    res.status(200).send({ message: "Product updated successfully", modifiedCount: result.modifiedCount });
  }

  catch (error) {
    console.error("Error updating product:", error);
    res.status(500).send({ error: "Failed to update product" });
  }
})


//product delete api
app.delete("/products/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const filter = { _id: new ObjectId(productId) };
    const result = await productCollection.deleteOne(filter); 
    if (result.deletedCount === 1) {
      res.status(200).send({ message: "Product deleted successfully" });
    }
    else {
      res.status(404).send({ error: "Product not found" });
    }
  }
  catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).send({ error: "Failed to delete product" });
  }
})




  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});