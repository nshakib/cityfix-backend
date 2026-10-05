import app from "./app";
import config from "./app/config";
import { transporter } from "./app/lib/nodemailer";
import { prisma } from "./app/lib/prisma";
import { redisClient } from "./app/lib/redis";

const PORT = config.port;

const main = async () => {
	try {
		await prisma.$connect();
		console.log("Connected to the database successfully.");

		await redisClient.connect();
		console.log("Redis Connected Successfully.");

		await transporter.verify();
		console.log("Nodemailer Connected Successfully.");

		app.listen(PORT, () => {
			console.log(`🚀 Server running on port ${PORT}`);
		});
	} catch (error) {
		console.error("Error starting the server:", error);

		// Safely clean up connections if startup fails
		try { await prisma.$disconnect(); } catch (e) { /* ignore */ }
		try { await redisClient.disconnect(); } catch (e) { /* ignore */ }
		
		process.exit(1);
	}
};

// 🛡️ Graceful Shutdown Handling
const gracefulShutdown = async (signal: string) => {
	console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);
	
	try { await prisma.$disconnect(); } catch (e) { /* ignore */ }
	try { await redisClient.disconnect(); } catch (e) { /* ignore */ }
	
	console.log("✅ Connections closed. Exiting.");
	process.exit(0);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

main();
