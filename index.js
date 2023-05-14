const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;

// middleware 
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
   res.send("Car Doctor is running ...");
});


//=============================Mango Start
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xu5udz0.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
   serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
   }
});

// এখানে তিনটা প্যারামিটার দিতে হবে।
/* const verifyJWT = (req, res, next) => {
   // console.log("Hitting verify jWT");
   // console.log(req.headers.authorization);
   const authorization = req.headers.authorization;
   if (!authorization) {
      return res.status(401).send({ error: true, message: "Unauthorized access. " });
   }
   const token = authorization.split(' ')[1];
   console.log("Inside verify JWT :", token);
   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
      if (error) {
         return res.send({ error: true, message: "Unauthorized access." });
      }
      req.decoded = decoded;
      next();
   });

}; */
// ===================recap===============
/// ekhane extra prameter hishebe next parameter nite hobe 
const verifyJWT = (req, res, next) => {
   const authorization = req.headers.authorization;
   if (!authorization) {
      return res.status(401).send({ error: true, message: "unauthorized access" });
   }
   const token = authorization.split(' ')[1];
   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
      if (error) {
         return res.status(401).send({ error: true, message: "unauthorized access." });
      }
      // ekhane set kora hoyeche
      req.decoded = decoded;
      next();
   });
};

async function run() {
   try {
      // Connect the client to the server	(optional starting in v4.7)
      await client.connect();

      // step-1
      const servicesCollection = client.db('car_doctor').collection('services');
      const bookingCollection = client.db('car_doctor').collection('bookings');

      // ==========================JWT=================
      app.post('/jwt', (req, res) => {
         const user = req.body;
         console.log(user);
         const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
         console.log(token);
         res.send({ token });
      });



      // =================================services routes ============================
      // =============================================================================
      //step-2 
      app.get('/services', async (req, res) => {
         const cursor = servicesCollection.find();
         const result = await cursor.toArray();
         res.send(result);
      });

      // step-3 : specific on id show then
      app.get('/services/:id', async (req, res) => {
         // result = await servicesCollection.findOne({_id: new ObjectId(req.params.id)})
         const id = req.params.id;
         const query = { _id: new ObjectId(id) };

         const options = {
            projection: { title: 1, img: 1, price: 1 },
         };

         const result = await servicesCollection.findOne(query, options);
         res.send(result);
      });

      // =================================booking routes ============================
      // ============================================================================
      // step-5
      app.get('/bookings', verifyJWT, async (req, res) => {

         // ekhane read kora hoyeche
         const decoded = req.decoded;
         console.log('comeback after verify', decoded);
         if (decoded.email !== req.query.email) {
            return res.status(403).send({ error: 1, message: "forbidden access" });
         }

         // console.log(req.query.email);
         // console.log(req.headers.authorization);
         let query = {};
         if (req.query?.email) {
            query = { email: req.query.email };
         };
         const result = await bookingCollection.find(query).toArray();
         res.send(result);
      });

      // step-4 :
      app.post('/bookings', async (req, res) => {
         const booking = req.body;
         console.log(booking);
         const result = await bookingCollection.insertOne(booking);
         res.send(result);
      });


      // step-6 : 
      app.patch('/bookings/:id', async (req, res) => {
         const id = req.params.id;
         // onst options = { upsert: true }; এখানে upsert true ইউজ করা লাগবে না
         // কারণ যদি ডাটা থাকে তাহলে ইউজ করা আর থাকলে আপডেট/রিপ্লেস কর। 
         const filter = { _id: new ObjectId(id) };
         const updatedBooking = req.body;
         const updateDoc = {
            $set: {
               status: updatedBooking.status
            },
         };
         //  এখানে options পাঠাব না। 
         const result = await bookingCollection.updateOne(filter, updateDoc);
         res.send(result);
         console.log(updatedBooking);

         // await;
      });


      // step-5 : 
      app.delete('/bookings/:id', async (req, res) => {
         const id = req.params.id;
         const query = { _id: new ObjectId(id) };
         const result = await bookingCollection.deleteOne(query);
         res.send(result);
      });

      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
   } finally {
      // Ensures that the client will close when you finish/error
      // await client.close();
   }
}
run().catch(console.dir);
//================================Mango End




app.listen(port, () => {
   console.log(`Car Doctor is running on port : ${port}`);
});