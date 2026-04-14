import { spawn } from 'child_process';
import express from 'express';
import cors from 'cors';
import { scoreAccount } from './scorer';
import { Follower } from './types';
import { sequelize } from './db';
import { KnownBot } from './models/KnownBot';

const app = express();
const PORT = 3001;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/analyze', async (req, res) => {
  const { username } = req.body as { username: string };

  if (!username) {
    res.status(400).json({ error: 'username is required' });
    return;
  }

  const scraperPath = require('path').join(__dirname, '../../scripts/get_followers.py');

  const followers: Follower[] = await new Promise((resolve, reject) => {
    const proc = spawn('python3', [scraperPath, username]);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    proc.on('close', (code: number) => {
      if (code !== 0) {
        reject(new Error(`Scraper exited with code ${code}: ${stderr}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout) as Follower[]);
      } catch {
        reject(new Error(`Failed to parse scraper output: ${stdout.slice(0, 200)}`));
      }
    });

    proc.on('error', reject);
  });

  const results: Follower[] = await Promise.all(
    followers.map(async (follower) => {
      const cached = await KnownBot.findOne({ where: { id: follower.id } });
      const isStale = !cached || (Date.now() - cached.lastSeenAt.getTime() > CACHE_TTL_MS);

      if (!isStale && cached) {
        return {
          ...follower,
          botScore: cached.botScore,
          isKnownBot: cached.isKnownBot,
          flaggedFields: cached.flaggedFields,
          reasons: cached.reasons,
        };
      }

      const { botScore, flaggedFields, reasons } = scoreAccount(follower);
      const isKnownBot = botScore >= 75;

      await KnownBot.upsert({
        id: follower.id,
        username: follower.username,
        displayName: follower.displayName,
        botScore,
        isKnownBot,
        followerCount: follower.followerCount,
        followingCount: follower.followingCount,
        postCount: follower.postCount,
        firstPostDate: follower.createdAt,
        flaggedFields,
        reasons,
      });

      return { ...follower, botScore, isKnownBot, flaggedFields, reasons };
    })
  );

  const sorted = results.sort((a, b) => b.botScore - a.botScore);
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
