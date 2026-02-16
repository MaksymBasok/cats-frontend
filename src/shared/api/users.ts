// src/shared/api/users.ts
import { api } from "./client";
import type { UserDto, CreateUserDto, UpdateUserDto, UpdateProfileDto } from "@/shared/types";

export async function getUsers(): Promise<UserDto[]> {
  return api<UserDto[]>("/users");
}

export async function createUser(data: CreateUserDto): Promise<void> {
  return api<void>("/users", { method: "POST", body: data });
}

export async function updateUser(id: string, data: UpdateUserDto): Promise<void> {
  return api<void>(`/users/${id}`, { method: "PUT", body: data });
}

export async function activateUser(id: string): Promise<void> {
  return api<void>(`/users/${id}/activate`, { method: "POST" });
}

export async function deactivateUser(id: string): Promise<void> {
  return api<void>(`/users/${id}/deactivate`, { method: "POST" });
}

export async function getProfile(): Promise<UserDto> {
  return api<UserDto>("/profile");
}

export async function updateProfile(data: UpdateProfileDto): Promise<void> {
  return api<void>("/profile", { method: "PUT", body: data });
}
