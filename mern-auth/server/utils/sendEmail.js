import nodemailer from "nodemailer";

/**
 * Sends an email using Nodemailer.
 * @param {Object} options - The email options object.
 * @param {string} options.to - Recipient's email address.
 * @param {string} options.subject - Subject of the email.
 * @param {string} options.text - Plain text body.
 * @param {string} options.html - HTML body.
 * @returns {Promise<Object>} The info object from nodemailer.
 */
export const sendEmail = async (options) => {
    const transportConfig = {};

    if (process.env.EMAIL_HOST) {
        transportConfig.host = process.env.EMAIL_HOST;
        transportConfig.port = parseInt(process.env.EMAIL_PORT || "2525", 10);
        transportConfig.secure = transportConfig.port === 465;
    } else {
        transportConfig.service = process.env.EMAIL_SERVICE || "Gmail";
    }

    transportConfig.auth = {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    };

    const transporter = nodemailer.createTransport(transportConfig);

    const mailOptions = {
        from: `"MERN Auth Support" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully: ", info.messageId);
        return info;
    } catch (error) {
        console.error("Error occurred while sending email: ", error);
        throw new Error("Email could not be sent.");
    }
};

export default sendEmail;
