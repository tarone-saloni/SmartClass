import 'dotenv/config';
import connectDB from './app/config/ConnectDB.js';
import { buildApp } from './app.js';

connectDB();

const { httpServer } = buildApp();

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
