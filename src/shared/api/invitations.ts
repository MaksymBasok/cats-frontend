import { api } from "./client";
import type { InvitationDto, CreateInvitationDto } from "@/shared/types";

export async function createInvitation(data: CreateInvitationDto): Promise<InvitationDto> {
  return api<InvitationDto>("/invitations", { method: "POST", body: data });
}

export async function verifyInvitation(token: string): Promise<InvitationDto> {
  return api<InvitationDto>(`/invitations/verify/${token}`);
}
