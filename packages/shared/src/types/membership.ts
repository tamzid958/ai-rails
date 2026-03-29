import { z } from "zod";
import { Forbidden } from "../errors.js";

export const MemberRoleSchema = z.enum(["OWNER", "LEAD", "MEMBER"]);
export type MemberRoleType = z.infer<typeof MemberRoleSchema>;

export const AddMemberSchema = z.object({
  email: z.string().email(),
  role: MemberRoleSchema.default("MEMBER"),
});

export type AddMember = z.infer<typeof AddMemberSchema>;

/** Throws Forbidden if callerRole is not allowed to assign targetRole. */
export function assertCanAssignRole(
  callerRole: MemberRoleType,
  targetRole: MemberRoleType,
): void {
  if (callerRole === "LEAD" && targetRole === "OWNER") {
    throw new Forbidden("LEADs cannot assign the OWNER role");
  }
}
