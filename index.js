const express = require('express');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4200;

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(cors());

var admin = require("firebase-admin");
var serviceAccount = require("./gh-task-firebase-adminsdk-wvbpp-530f3617e5.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });


const { DB_USER, DB_PASS, DB_NAME} = process.env;


const uri = `mongodb+srv://${DB_USER}:${DB_PASS}@cluster0.iohsv.mongodb.net/${DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


app.get('/', (req, res) => {
  res.send('Backend Server is Running!!')
})


client.connect(err => {
  const tasksCollection = client.db("ghTask").collection("tasks");
  const adminCollection = client.db("ghTask").collection("admin");
    
  app.post('/addTask', (req, res) => {
      const findDate = tasksCollection.find({$and :[{"userAssigned": req.body.userAssigned}, {"startDate": req.body.startDate}]})
      .toArray((err, documents) => {
        if(documents.length === 1){
            res.send(false)
        }else{
            const reqBody = req.body;
        tasksCollection.insertOne(reqBody)
        .then(result => {
        console.log(result.insertedCount);
          res.send(result.insertedCount > 0);
        })
        }
      })
        
  })

  app.get("/allTask", (req, res) => {
    adminCollection.find({email: req.query.email})
    .toArray((err, admin) => {
      if(admin.length === 0){
        tasksCollection.find({userAssigned: req.query.email})
        .toArray((err, documents) => {
        res.send(documents);
        });
      }else{
        tasksCollection.find({})
        .toArray((err, documents) => {
          res.send(documents);
        })
      }
    })  
  });

  app.get('/allUser', (req, res) => {
        admin
          .auth()
          .listUsers(1000)
          .then((listUsersResult) => res.send(listUsersResult.users))
          .catch((error) => {
            console.log('Error listing users:', error);
          });
      // Start listing users from the beginning, 1000 at a time.
  })

  app.get("/adminCheck", (req, res) => {
    adminCollection.find({email: req.query.email})
    .toArray((err, documents) => {
      res.send(documents);
    });
  });

  app.patch('/updateStatus', (req, res) => {
    tasksCollection.updateOne({_id: ObjectId(req.body.taskID)}, {$set : {status: req.body.status}})
    .then(result => {
      res.send(result.modifiedCount > 0)
    })
  })

  console.log('Database Connected:', client.isConnected());
//   client.close();
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`)
})
 