// src/shared/api/invitations.ts
import { api } from "./client";
import type { CreateInvitationDto } from "@/shared/types";

export async function createInvitation(data: CreateInvitationDto): Promise<void> {
  return api<void>("/invitations", { method: "POST", body: data });
}

export async function verifyInvitation(token: string): Promise<void> {
  return api<void>(`/invitations/verify/${encodeURIComponent(token)}`, { auth: false });
}
