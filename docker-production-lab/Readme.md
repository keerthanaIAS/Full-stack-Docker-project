# 1. Regular (1GB) - Has everything
FROM node:20

# 2. Alpine (70MB) - Has shell, package manager
FROM node:20-alpine

# 3. Distroless (50MB) - Only runtime, NO shell
FROM gcr.io/distroless/nodejs20-debian11