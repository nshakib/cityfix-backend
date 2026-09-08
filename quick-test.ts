import { cloudinary } from "./src/app/lib/cloudinary";
import fs from "fs";

// Create a tiny test file first, or point to any image you already have on disk
cloudinary.uploader
	.upload("./city-fix-ERD.jpg") // put any small jpg/png in your project root named this
	.then((result) => console.log("SUCCESS:", result.secure_url))
	.catch((error) => console.error("FAILED:", error));