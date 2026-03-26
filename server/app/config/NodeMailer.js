import nodemailer from 'nodemailer';
import { config } from 'dotenv';

config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || "araut7798@gmail.com",
    pass: process.env.EMAIL_PASS || "wyri lkqi eixn lfod",
  },
});

export default transporter;