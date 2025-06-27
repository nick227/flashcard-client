// API request/response types

export interface Category {
  id: number;
  name: string;
  setCount: number;
}

export interface SetEducator {
  id: number;
  name: string;
  image: string | null;
}

export interface Set {
  id: number;
  title: string;
  description: string;
  thumbnail: string | null;
  price: number;
  isSubscriberOnly: boolean;
  educator: SetEducator | null;
}

export interface CategoryWithSets {
  id: number;
  name: string;
  sets: Set[];
}

export interface Tag {
  id: number;
  name: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthRegisterPayload {
  name: string;
  email: string;
  password: string;
  role_id: number;
  bio?: string;
} 