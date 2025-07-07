To add refresh token support to the user table, create a new migration with:

```bash
npx prisma migrate dev --name add_refresh_token
```

With this schema change:

```prisma
// Add this to the User model in schema.prisma
model User {
  // ... existing fields
  refreshToken String? // Optional refresh token
}
```

This allows implementing token refresh functionality in the future.
