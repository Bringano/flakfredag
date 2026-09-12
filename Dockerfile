# ---------- Stage 1: build the React client ----------
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

# ---------- Stage 2: build the .NET API ----------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS server-build
WORKDIR /src
COPY server/BeerApp.Api.csproj ./server/
RUN dotnet restore ./server/BeerApp.Api.csproj
COPY server/ ./server/
RUN dotnet publish ./server/BeerApp.Api.csproj -c Release -o /app/publish --no-restore

# ---------- Stage 3: production runtime ----------
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

COPY --from=server-build /app/publish .
COPY --from=client-build /app/client/dist ./wwwroot

ENV ASPNETCORE_ENVIRONMENT=Production
ENV PORT=3000
EXPOSE 3000
ENTRYPOINT ["dotnet", "BeerApp.Api.dll"]
