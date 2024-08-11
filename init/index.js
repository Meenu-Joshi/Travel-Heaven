const mongoose=require("mongoose");
const initData=require("./data.js");
const listing=require("../models/listing.js");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";


main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

  async function main() {
    await mongoose.connect(MONGO_URL);
  }

  const initDb=async function(){  
    await Listing.deleteMany({});
   initData.data=initData.data.map((obj)=>({...obj,owner:"66679f0d9d3f1b0bba0cb7c5"}))
    await Listing.insertMany(initData.data).then((res)=>{
        console.log("Data is intialized");
    }).catch((err)=>{
        console.log(err);
    });

   
  }

  initDb();