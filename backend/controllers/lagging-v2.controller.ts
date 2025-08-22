/**
 * @file controllers/lagging-v2.controller.ts
 * @description
 *  - Refactored Lagging controller for v2 API
 */

import { Request, Response } from "express";
import LaggingV2Service from "../services/lagging-v2.service";

export default class LaggingV2Controller {
  /**
   * GET /api/lagging/v2/summary/:year
   * Get all lagging indicators for a specific year
   */
  static async getSummary(req: Request, res: Response) {
    const { year } = req.params;
    
    if (!year || isNaN(Number(year))) {
      return res.status(400).json({ error: 'Valid year is required' });
    }

    try {
      console.log(`[LaggingV2Controller] Getting summary for year ${year}`);
      
      const summary = await LaggingV2Service.getSummaryByYear(Number(year));
      
      console.log(`[LaggingV2Controller] Summary retrieved successfully`);
      
      return res.status(200).json(summary);
    } catch (error: any) {
      console.error(`[LaggingV2Controller] Error getting summary:`, error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/lagging/v2/clear-cache
   * Clear the cache (for testing/debugging)
   */
  static async clearCache(req: Request, res: Response) {
    try {
      LaggingV2Service.clearCache();
      return res.status(200).json({ message: 'Cache cleared successfully' });
    } catch (error: any) {
      console.error(`[LaggingV2Controller] Error clearing cache:`, error);
      return res.status(500).json({ error: error.message });
    }
  }
}