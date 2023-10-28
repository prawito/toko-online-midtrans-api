import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(cors());

app.use(routes);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});
