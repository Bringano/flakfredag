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

app.MapGet("/api/beers", async (Db db) => Results.Ok(await db.GetBeersAsync()));

app.MapPost("/api/beers", async (NewBeerRequest req, Db db) =>
{
    if (string.IsNullOrWhiteSpace(req.Name))
        return Results.BadRequest(new { error = "Ölens namn kan inte vara tomt." });

    var beer = await db.CreateBeerAsync(req.Name.Trim(), string.IsNullOrWhiteSpace(req.Brewery) ? null : req.Brewery!.Trim());
    return Results.Created($"/api/beers/{beer.Id}", beer);
});

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

app.MapGet("/api/stats/persons", async (Db db) => Results.Ok(await db.GetPersonStatsAsync()));

// SPA-fallback: alla icke-API-routes (t.ex. vid sidladdning på en klientroute) serverar index.html.
app.MapFallbackToFile("index.html");

app.Run();
