import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const chartQuerySchema = z.object({
  range: z.enum(['7d', '30d', '90d', 'all']).optional().default('30d')
});

export const validateChartQuery = (req: Request, res: Response, next: NextFunction) => {
  try {
    chartQuerySchema.parse(req.query);
    next();
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: 'Invalid chart filter range.',
      errors: error.errors
    });
  }
};
