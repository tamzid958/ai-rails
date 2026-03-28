import { z } from "zod";

export const MemberRoleSchema = z.enum(["OWNER", "LEAD", "MEMBER"]);
export type MemberRoleType = z.infer<typeof MemberRoleSchema>;

export const AddMemberSchema = z.object({
  email: z.string().email(),
  role: MemberRoleSchema.default("MEMBER"),
});

export type AddMember = z.infer<typeof AddMemberSchema>;
