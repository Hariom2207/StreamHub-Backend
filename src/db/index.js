import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    
    try {
        
      console.log("Connection loading...");
        
      const connectioInstance =  await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

      console.log(`\n ** MongoDB connected !! DB HOST : ${connectioInstance.connection.host}`);

    //   console.log("Connection Successful");
     
      
      
    } catch (error) {
        console.log("MOngoDB connection Failed ",error);
        process.exit(1)
        
    }
}

export default connectDB;