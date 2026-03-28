# Roles & Permissions

## Role Hierarchy

Each product membership has one of three roles:

| Role | Description |
|------|-------------|
| **OWNER** | Full control over the product |
| **LEAD** | Team management, cannot change ownership |
| **MEMBER** | Individual contributor |

## Permissions Matrix

| Action | MEMBER | LEAD | OWNER |
|--------|--------|------|-------|
| View own dashboard | Yes | Yes | Yes |
| Log AI activities | Yes | Yes | Yes |
| Create prompt overrides | Yes | Yes | Yes |
| View team overview | No | Yes | Yes |
| View team costs | No | Yes | Yes |
| View team engineers | No | Yes | Yes |
| View prompt drift | No | Yes | Yes |
| Invite members | No | Yes | Yes |
| Create base templates | No | Yes | Yes |
| Promote overrides to base | No | Yes | Yes |
| Change member roles | No | No | Yes |
| Remove members | No | No | Yes |
| Update product settings | No | No | Yes |
| Delete product | No | No | Yes |

## Role Assignment

- The engineer who creates a product is automatically the OWNER
- OWNERs can assign any role (OWNER, LEAD, MEMBER)
- LEADs can invite new members as MEMBER or LEAD (not OWNER)
- MEMBERs cannot invite or manage other members

## Enforcement

Roles are enforced at two levels:

1. **API route guards** (`preHandler` hooks) — reject unauthorized requests with 403
2. **Dashboard layout guards** — hide UI sections the user cannot access
