import express from 'express';
import cors from 'cors';
import { mockFollowers } from './mockData';
import { scoreAccount } from './scorer';
import { Follower } from './types';
import { sequelize } from './db';

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/analyze', (req, res) => {
  const { username } = req.body as { username: string };

  if (!username) {
    res.status(400).json({ error: 'username is required' });
    return;
  }

  const scored: Follower[] = mockFollowers.map((follower) => {
    const { botScore, flaggedFields, reasons } = scoreAccount(follower);
    return { ...follower, botScore, flaggedFields, reasons };
  });

  const sorted = scored.sort((a, b) => b.botScore - a.botScore);

  res.json(sorted);
});

sequelize.sync({ force: false }).then(() => {
  console.log('Database connected and tables ready');
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch((err: Error) => {
  console.error('Failed to connect to database:', err.message);
  process.exit(1);
});
