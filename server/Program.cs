using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Npgsql;
using BeerApp.Api.Data;
using BeerApp.Api.Models;

var builder = WebApplication.CreateBuilder(args);

// JSON i camelCase (matchar det React-frontenden förväntar sig, t.ex. "avgScore").
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

// Läser DATABASE_URL (t.ex. postgresql://user:pass@host:5432/dbname) och bygger en
// Npgsql-anslutningssträng av den. "SSL Mode=Prefer" gör att det funkar både lokalt
// (ingen SSL) och på Render (kräver SSL) utan att vi behöver skilja på miljö.
static string BuildConnectionString(string databaseUrl)
{
    var uri = new Uri(databaseUrl);
    var userInfo = uri.UserInfo.Split(':', 2);

    var csb = new NpgsqlConnectionStringBuilder
    {
        Host = uri.Host,
        Port = uri.Port > 0 ? uri.Port : 5432,
        Username = Uri.UnescapeDataString(userInfo[0]),
        Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "",
        Database = uri.AbsolutePath.TrimStart('/'),
        SslMode = SslMode.Prefer,
        TrustServerCertificate = true
    };
    return csb.ConnectionString;
}

var databaseUrl = builder.Configuration["DATABASE_URL"]
    ?? Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? throw new InvalidOperationException("DATABASE_URL saknas.");

var connectionString = BuildConnectionString(databaseUrl);

builder.Services.AddSingleton(NpgsqlDataSource.Create(connectionString));
builder.Services.AddSingleton<Db>();

// Servern lyssnar på port 3000 (samma i Docker Compose och på Render).
var port = Environment.GetEnvironmentVariable("PORT") ?? "3000";
builder.WebHost.UseUrls($"http://+:{port}");

var app = builder.Build();

// ---------- Enkelt delat lösenordsskydd (HTTP Basic Auth) ----------
// Ett gemensamt användarnamn/lösenord för alla — inget konto-system, ingen
// databas för användare. Sätts via miljövariabler (APP_USERNAME/APP_PASSWORD),
// aldrig i git. Om de inte är satta alls är skyddet avstängt (t.ex. bekvämt
// om man kör helt lokalt utan att bry sig).
//
// Skyddar bara /api/* (utom health-check) — INTE själva sidan/JS-bundlen.
// Det gör att frontendens egna lösenords-modal hinner visas innan något
// kräver inloggning (annars hade webbläsarens fula inloggningsruta dykt
// upp direkt vid sidladdning, före vår React-app ens hunnit rendera).
var appUsername = Environment.GetEnvironmentVariable("APP_USERNAME");
var appPassword = Environment.GetEnvironmentVariable("APP_PASSWORD");

if (!string.IsNullOrEmpty(appUsername) && !string.IsNullOrEmpty(appPassword))
{
    app.Use(async (context, next) =>
    {
        var path = context.Request.Path;
        var requiresAuth = path.StartsWithSegments("/api") && path != "/api/health";

        if (!requiresAuth)
        {
            await next();
            return;
        }

        var header = context.Request.Headers.Authorization.ToString();
        if (header.StartsWith("Basic ", StringComparison.Ordinal))
        {
            try
            {
                var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(header["Basic ".Length..]));
                var separatorIndex = decoded.IndexOf(':');
                if (separatorIndex >= 0)
                {
                    var user = decoded[..separatorIndex];
                    var pass = decoded[(separatorIndex + 1)..];
                    if (user == appUsername && pass == appPassword)
                    {
                        await next();
                        return;
                    }
                }
            }
            catch (FormatException)
            {
                // Ogiltig base64 — behandlas som fel inloggning nedan.
            }
        }

        context.Response.Headers.WWWAuthenticate = "Basic realm=\"FlakFredag\"";
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
    });
}

// Kör init.sql med några återförsök — databasen kan behöva några sekunder på sig
// att bli klar när allt startar samtidigt (t.ex. första gången i Docker Compose).
var db = app.Services.GetRequiredService<Db>();
for (var attempt = 1; attempt <= 10; attempt++)
{
    try
    {
        await db.InitAsync();
        break;
    }
    catch (Exception ex) when (attempt < 10)
    {
        app.Logger.LogWarning("Databasen inte redo än (försök {Attempt}/10): {Message}", attempt, ex.Message);
        await Task.Delay(2000);
    }
}

app.UseDefaultFiles();
app.UseStaticFiles();

// ---------- API ----------

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));

// Ingen egen "skapa öl"-endpoint: en öl ska aldrig kunna finnas utan minst en
// betygsatt provning. Nya öl skapas därför bara tillsammans med en provning,
// se POST /api/tastings nedan.
app.MapGet("/api/beers", async (Db db) => Results.Ok(await db.GetBeersAsync()));

app.MapGet("/api/tastings", async (Db db) => Results.Ok(await db.GetTastingsAsync()));

app.MapPost("/api/tastings", async (NewTastingRequest req, Db db) =>
{
    var hasExistingBeer = req.BeerId is int id && id > 0;
    var hasNewBeerName = !string.IsNullOrWhiteSpace(req.BeerName);

    if (!hasExistingBeer && !hasNewBeerName)
        return Results.BadRequest(new { error = "Välj en befintlig öl eller ange namn på en ny." });

    if (string.IsNullOrWhiteSpace(req.Food))
        return Results.BadRequest(new { error = "Ange vilken mat som åts till." });

    if (req.Scores is null || req.Scores.Count != Persons.All.Length)
        return Results.BadRequest(new { error = $"Alla tre ({string.Join(", ", Persons.All)}) måste betygsätta." });

    foreach (var person in Persons.All)
    {
        if (!req.Scores.TryGetValue(person, out var score))
            return Results.BadRequest(new { error = $"Saknar betyg för {person}." });
        if (score < 1 || score > 10)
            return Results.BadRequest(new { error = $"Betyg måste vara mellan 1 och 10 ({person})." });
    }

    var tasting = await db.CreateTastingAsync(req);
    return Results.Created($"/api/tastings/{tasting.Id}", tasting);
});

app.MapPut("/api/tastings/{id:int}", async (int id, UpdateTastingRequest req, Db db) =>
{
    if (string.IsNullOrWhiteSpace(req.Food))
        return Results.BadRequest(new { error = "Ange vilken mat som åts till." });

    if (string.IsNullOrWhiteSpace(req.BeerName))
        return Results.BadRequest(new { error = "Ange ölens namn." });

    if (req.Scores is null || req.Scores.Count != Persons.All.Length)
        return Results.BadRequest(new { error = $"Alla tre ({string.Join(", ", Persons.All)}) måste betygsätta." });

    foreach (var person in Persons.All)
    {
        if (!req.Scores.TryGetValue(person, out var score))
            return Results.BadRequest(new { error = $"Saknar betyg för {person}." });
        if (score < 1 || score > 10)
            return Results.BadRequest(new { error = $"Betyg måste vara mellan 1 och 10 ({person})." });
    }

    var updated = await db.UpdateTastingAsync(id, req.Food.Trim(), req.Scores, req.BeerName.Trim(), string.IsNullOrWhiteSpace(req.Brewery) ? null : req.Brewery.Trim());
    return updated is null
        ? Results.NotFound(new { error = "Provningen hittades inte." })
        : Results.Ok(updated);
});

app.MapDelete("/api/tastings/{id:int}", async (int id, Db db) =>
{
    var deleted = await db.DeleteTastingAsync(id);
    return deleted ? Results.NoContent() : Results.NotFound(new { error = "Provningen hittades inte." });
});

app.MapGet("/api/stats/persons", async (Db db) => Results.Ok(await db.GetPersonStatsAsync()));

// SPA-fallback: alla icke-API-routes (t.ex. vid sidladdning på en klientroute) serverar index.html.
app.MapFallbackToFile("index.html");

app.Run();
