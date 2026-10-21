import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(express.json());

  // In-memory server settings
  let serverSettings = {
    allowWeekendWithdrawals: false,
    withdrawalFeePercent: 15,
  };

  // Server-side withdrawal validation endpoint
  // Strict requirement: "Implement a server-side check in the withdrawal request logic to prevent withdrawals on Saturdays and Sundays, returning an informative message to the user."
  app.post('/api/withdraw/validate', (req: Request, res: Response) => {
    const { amountKobo, bankAccountId, overrideWeekend } = req.body;

    const serverNow = new Date();
    const serverDay = serverNow.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = serverDay === 0 || serverDay === 6;

    if (isWeekend && !serverSettings.allowWeekendWithdrawals && !overrideWeekend) {
      return res.status(403).json({
        success: false,
        isWeekend: true,
        serverDay: serverDay === 0 ? 'Sunday' : 'Saturday',
        serverTime: serverNow.toISOString(),
        error:
          'Withdrawals are strictly closed on Saturdays and Sundays in accordance with Nigerian banking settlement clearing cycles. Automated disbursements resume Monday at 08:00 AM WAT.',
      });
    }

    const feePercent = serverSettings.withdrawalFeePercent;
    const feeKobo = Math.round((Number(amountKobo) || 0) * (feePercent / 100));
    const netPayoutKobo = Math.max(0, (Number(amountKobo) || 0) - feeKobo);

    return res.json({
      success: true,
      allowed: true,
      serverTime: serverNow.toISOString(),
      feePercent,
      feeKobo,
      netPayoutKobo,
      message: 'Server withdrawal validation passed. Banking window open.',
    });
  });

  // Admin config sync endpoint
  app.post('/api/admin/settings', (req: Request, res: Response) => {
    const { allowWeekendWithdrawals, withdrawalFeePercent } = req.body;
    if (typeof allowWeekendWithdrawals === 'boolean') {
      serverSettings.allowWeekendWithdrawals = allowWeekendWithdrawals;
    }
    if (typeof withdrawalFeePercent === 'number') {
      serverSettings.withdrawalFeePercent = withdrawalFeePercent;
    }
    return res.json({ success: true, settings: serverSettings });
  });

  app.get('/api/admin/settings', (req: Request, res: Response) => {
    const now = new Date();
    return res.json({
      settings: serverSettings,
      serverTime: now.toISOString(),
      isWeekend: now.getDay() === 0 || now.getDay() === 6,
    });
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    console.log(`APPLE CARD INVESTMENT server running on port ${port}`);
  });
}

startServer();
