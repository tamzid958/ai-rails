---
layout: default
title: "Multi-Product Architecture"
---

# Multi-Product Architecture

## Overview

AIRails uses **products** as the top-level isolation boundary. Each product represents a team, project, or business unit. A single AIRails instance can serve many products with complete data isolation.

## How Isolation Works

Every piece of data in AIRails is scoped to a product:

```
Product A                        Product B
├── Engineers (memberships)      ├── Engineers (memberships)
├── Repos                        ├── Repos
├── AI Activities                ├── AI Activities
├── PR Events                    ├── PR Events
├── Prompt Templates             ├── Prompt Templates
├── Recommendations              ├── Recommendations
└── Cost Data                    └── Cost Data
```

An engineer can belong to multiple products with different roles. Their API keys are product-scoped — a key for Product A cannot access Product B's data.

## API Key Scoping

The API key is the single entry point for product resolution:

1. Engineer authenticates with `Bearer ar_k1_...`
2. Gateway resolves the key to a specific `(engineerId, productId, role)`
3. All subsequent queries include `WHERE productId = ...`

There are no bypasses — every data-returning endpoint enforces product scoping.

## One Engineer, Multiple Products

```
Engineer: alice@company.com
├── Product "Backend API"  → OWNER  → API Key: ar_k1_abc...
└── Product "Mobile App"   → MEMBER → API Key: ar_k1_xyz...
```

When Alice uses her Backend API key, she sees only Backend API data. When she switches to her Mobile App key, she sees only Mobile App data. The dashboard product switcher handles this seamlessly.

## Webhook Routing

GitHub/GitLab webhooks are routed by repository:

1. Webhook arrives for `org/payments-api`
2. AIRails looks up which product owns that repo
3. Activities are created under that product

A repository can only belong to one product (globally unique constraint).

## Database Indexes

All critical queries use product-prefixed composite indexes for efficient scoping:

- `AiActivity(productId, engineerId, createdAt)`
- `PrEvent(productId, engineerId, branchName)`
- `PromptTemplate(productId, taskType)`
