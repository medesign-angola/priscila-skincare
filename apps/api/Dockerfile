FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY global.json ./
COPY apps/api/PriscilaSkincare.Api.csproj apps/api/
COPY packages/backend-domain/PriscilaSkincare.Domain.csproj packages/backend-domain/
COPY packages/backend-application/PriscilaSkincare.Application.csproj packages/backend-application/
COPY packages/backend-infrastructure/PriscilaSkincare.Infrastructure.csproj packages/backend-infrastructure/
RUN dotnet restore apps/api/PriscilaSkincare.Api.csproj

COPY apps/api apps/api
COPY packages/backend-domain packages/backend-domain
COPY packages/backend-application packages/backend-application
COPY packages/backend-infrastructure packages/backend-infrastructure
COPY packages/storefront/public/assets/images/footer/otp-model.jpg packages/storefront/public/assets/images/footer/otp-model.jpg
RUN dotnet publish apps/api/PriscilaSkincare.Api.csproj --configuration Release --no-restore --output /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
RUN apt-get update \
    && apt-get install --yes --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/publish ./
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "PriscilaSkincare.Api.dll"]
