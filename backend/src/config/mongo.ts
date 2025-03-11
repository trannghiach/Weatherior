import mongoose from "mongoose"
import { MONGO_URI } from "../constants/env";

const connectToMongoDB = async () => {
    try {
        mongoose.connect(MONGO_URI);
        console.log("Succesfully connected to the MongoDB");
    } catch(error) {
        console.log(`Failed connecting to the MongoDB: `, error);
        process.exit(1);
    }
};

export default connectToMongoDB;