import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars at the very beginning of the ES module execution tree
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
