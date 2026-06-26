import { dashboardRepository } from '../repositories/dashboard.repository';
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient: any = null;
let isRedisConnected = false;

if (process.env.REDIS_URL) {
  try {
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (err: any) => console.warn('Redis connection issue:', err.message));
    redisClient.connect()
      .then(() => {
        isRedisConnected = true;
      })
      .catch((e: any) => {
        console.warn('Redis failed connection, bypassing caching. Error:', e.message);
      });
  } catch (err) {
    console.warn('Redis initialization failed');
  }
}

export class DashboardService {
  private async getCache(key: string): Promise<any> {
    if (!isRedisConnected || !redisClient) return null;
    try {
      const cached = await redisClient.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  private async setCache(key: string, data: any, ttl = 60): Promise<void> {
    if (!isRedisConnected || !redisClient) return;
    try {
      await redisClient.set(key, JSON.stringify(data), { EX: ttl });
    } catch (e) {
      // ignore cache write failures
    }
  }

  async getStats(userId: string, role: string) {
    const cacheKey = `dashboard:stats:${userId}:${role}`;
    const cachedStats = await this.getCache(cacheKey);
    if (cachedStats) return cachedStats;

    const globalStats = await dashboardRepository.getGlobalStats();
    let roleStats: any = {};

    if (role === 'mentor') {
      roleStats = await dashboardRepository.getMentorStats(userId);
    } else if (role === 'student') {
      roleStats = await dashboardRepository.getStudentStats(userId);
    }

    const mergedStats = {
      ...globalStats,
      roleSpecific: roleStats
    };

    await this.setCache(cacheKey, mergedStats, 60); // Cache for 60 seconds
    return mergedStats;
  }

  async getCharts() {
    const cacheKey = 'dashboard:charts';
    const cachedCharts = await this.getCache(cacheKey);
    if (cachedCharts) return cachedCharts;

    const chartsData = await dashboardRepository.getHistoricalTrends();
    await this.setCache(cacheKey, chartsData, 120); // Cache trends for 2 mins
    return chartsData;
  }

  async getRecentActivities() {
    const cacheKey = 'dashboard:recent-activities';
    const cachedActivities = await this.getCache(cacheKey);
    if (cachedActivities) return cachedActivities;

    const activities = await dashboardRepository.getRecentActivities();
    await this.setCache(cacheKey, activities, 30); // Cache recent activities for 30s
    return activities;
  }
}

export const dashboardService = new DashboardService();
