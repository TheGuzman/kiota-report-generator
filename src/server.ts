import dotenv from 'dotenv';
import app from './app.js';
import log from './logger.js';

dotenv.config();

const port = process.env.PORT ?? 3000;

app.listen(port, async () => {
  log.info(`Server started in port ${port}`);
});
