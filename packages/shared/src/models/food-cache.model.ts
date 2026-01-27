export interface FoodCache {
  id: string;
  foodNumber: string;
  payloadJson: any;
  fetchedAt: Date;
  expiresAt: Date;
  apiVersion?: string;
}

export interface NutrientCache {
  id: string;
  foodNumber: string;
  payloadJson: any;
  fetchedAt: Date;
  expiresAt: Date;
  apiVersion?: string;
}
