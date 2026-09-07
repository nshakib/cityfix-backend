import nodemailer from "nodemailer";
import config from "../config";
import { transporter } from "../lib/nodemailer";

export const sendEmail = async (to: string, subject: string, html: string) => {
	try {
		await transporter.sendMail({
			from: `"CityFix Support" <${config.email_sender}>`,
			to,
			subject,
			html,
		});
		console.log(`✅ Email sent to ${to}: ${subject}`);
	} catch (error) {
		console.error("❌ Email sending failed:", error);
		// We don't throw here to avoid breaking the main user flow (e.g., complaint creation)
	}
};
