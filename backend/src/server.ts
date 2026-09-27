import 'dotenv/config';
import { createApp } from './app';
import { connectDB } from './config/db';

const PORT = Number(process.env.PORT) || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/welcome-darjeeling';

async function main() {
  await connectDB(MONGODB_URI);

  const app = createApp();
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Welcome Darjeeling API listening on port ${PORT}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server:', err);
  process.exit(1);
});
