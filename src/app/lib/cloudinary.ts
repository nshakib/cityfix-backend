import { v2 as Cloudinary } from "cloudinary";
// import config from "../config";

// Configure Cloudinary (use your own cloud_name, api_key, and api_secret)

Cloudinary.config({
	// cloud_name: config.cloudinary_cloud_name,
	// api_key: config.cloudinary_api_key,
	// api_secret: config.cloudinary_api_secret
	cloud_name: "du8joxxsm",
	api_key: "818349942896965",
	api_secret: "OQ8USRPk2ncyGXVKGSU1SU29hwI",
});

Cloudinary.api
	.ping()
	.then((res) => console.log("✅ CLOUDINARY CREDENTIALS ARE VALID:", res))
	.catch((err) =>
		console.error("❌ CLOUDINARY AUTHENTICATION FAILED:", err.message),
	);

export const cloudinary = Cloudinary;
