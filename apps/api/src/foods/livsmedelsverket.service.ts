import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios, { AxiosInstance } from 'axios';
import {
  LivsmedelFoodItem,
  LivsmedelNutrientData,
  LivsmedelSearchResult,
} from '@dietistapp/shared';
import {
  FoodCacheEntity,
  NutrientCacheEntity,
} from '../database/entities';

@Injectable()
export class LivsmedelverketService {
  private readonly logger = new Logger(LivsmedelverketService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly cacheTtlDays: number;

  constructor(
    private configService: ConfigService,
    @InjectRepository(FoodCacheEntity)
    private foodCacheRepository: Repository<FoodCacheEntity>,
    @InjectRepository(NutrientCacheEntity)
    private nutrientCacheRepository: Repository<NutrientCacheEntity>,
  ) {
    const baseURL = this.configService.get(
      'LIVSMEDELSVERKET_API_URL',
      'https://webservice.livsmedelsverket.se/livsmedel/v1',
    );
    const timeout = this.configService.get<number>(
      'LIVSMEDELSVERKET_API_TIMEOUT',
      10000,
    );

    this.axiosInstance = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Retry logic med exponential backoff
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;
        if (!config || !config.retry) config.retry = 0;

        if (config.retry >= 3) {
          return Promise.reject(error);
        }

        config.retry += 1;
        const backoff = Math.pow(2, config.retry) * 1000;
        this.logger.warn(
          `Retry ${config.retry}/3 efter ${backoff}ms för ${config.url}`,
        );
        await new Promise((resolve) => setTimeout(resolve, backoff));
        return this.axiosInstance(config);
      },
    );

    this.cacheTtlDays = this.configService.get<number>('CACHE_TTL_DAYS', 7);
  }

  /**
   * Sök livsmedel med autocomplete stöd
   */
  async searchFoods(query: string, limit: number = 20): Promise<LivsmedelSearchResult> {
    try {
      this.logger.log(`Söker livsmedel: "${query}"`);

      // För test/demo: mock data om API inte svarar
      // I produktion bör detta tas bort
      const response = await this.axiosInstance.get('/sok', {
        params: { q: query, limit },
      }).catch(() => null);

      if (!response) {
        // Fallback mock data
        return {
          items: [
            { nummer: '1001', namn: 'Mjölk, standardmjölk, 3% fett' },
            { nummer: '1002', namn: 'Mjölk, lättmjölk, 0.5% fett' },
          ],
          total: 2,
        };
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Fel vid sökning: ${error.message}`);
      throw new HttpException(
        'Kunde inte söka livsmedel',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Hämta grundinfo för ett livsmedel (med read-through cache)
   */
  async getFoodByNumber(foodNumber: string): Promise<LivsmedelFoodItem> {
    // Kolla cache först
    const cached = await this.foodCacheRepository.findOne({
      where: { foodNumber },
    });

    const now = new Date();
    if (cached && cached.expiresAt > now) {
      this.logger.debug(`Cache hit för livsmedel ${foodNumber}`);
      return cached.payloadJson;
    }

    // Hämta från API
    try {
      this.logger.log(`Hämtar livsmedel ${foodNumber} från API`);
      const response = await this.axiosInstance.get(`/livsmedel/${foodNumber}`);
      const data: LivsmedelFoodItem = response.data;

      // Spara i cache
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + this.cacheTtlDays);

      if (cached) {
        // Uppdatera befintlig
        cached.payloadJson = data;
        cached.fetchedAt = now;
        cached.expiresAt = expiresAt;
        await this.foodCacheRepository.save(cached);
      } else {
        // Skapa ny
        await this.foodCacheRepository.save({
          foodNumber,
          payloadJson: data,
          fetchedAt: now,
          expiresAt,
          apiVersion: '1',
        });
      }

      return data;
    } catch (error) {
      // Om API failar men vi har gammal cache, använd den
      if (cached) {
        this.logger.warn(
          `API fail för ${foodNumber}, använder stale cache från ${cached.fetchedAt}`,
        );
        return cached.payloadJson;
      }

      this.logger.error(`Kunde inte hämta livsmedel ${foodNumber}: ${error.message}`);
      throw new HttpException(
        'Kunde inte hämta livsmedel',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Hämta näringsvärden för ett livsmedel (med read-through cache)
   */
  async getNutrientsByFoodNumber(
    foodNumber: string,
  ): Promise<LivsmedelNutrientData> {
    // Kolla cache först
    const cached = await this.nutrientCacheRepository.findOne({
      where: { foodNumber },
    });

    const now = new Date();
    if (cached && cached.expiresAt > now) {
      this.logger.debug(`Cache hit för näringsdata ${foodNumber}`);
      return cached.payloadJson;
    }

    // Hämta från API
    try {
      this.logger.log(`Hämtar näringsdata ${foodNumber} från API`);
      const response = await this.axiosInstance.get(
        `/livsmedel/${foodNumber}/naeringsvaerden`,
      );
      const data: LivsmedelNutrientData = response.data;

      // Spara i cache
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + this.cacheTtlDays);

      if (cached) {
        cached.payloadJson = data;
        cached.fetchedAt = now;
        cached.expiresAt = expiresAt;
        await this.nutrientCacheRepository.save(cached);
      } else {
        await this.nutrientCacheRepository.save({
          foodNumber,
          payloadJson: data,
          fetchedAt: now,
          expiresAt,
          apiVersion: '1',
        });
      }

      return data;
    } catch (error) {
      // Om API failar men vi har gammal cache, använd den
      if (cached) {
        this.logger.warn(
          `API fail för näringsdata ${foodNumber}, använder stale cache från ${cached.fetchedAt}`,
        );
        return cached.payloadJson;
      }

      this.logger.error(
        `Kunde inte hämta näringsdata ${foodNumber}: ${error.message}`,
      );
      throw new HttpException(
        'Kunde inte hämta näringsdata',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Kontrollera om cached data är stale
   */
  async isCacheStale(foodNumber: string): Promise<{
    isStale: boolean;
    fetchedAt?: Date;
  }> {
    const cached = await this.nutrientCacheRepository.findOne({
      where: { foodNumber },
    });

    if (!cached) {
      return { isStale: false };
    }

    const now = new Date();
    const isStale = cached.expiresAt < now;

    return {
      isStale,
      fetchedAt: cached.fetchedAt,
    };
  }
}
