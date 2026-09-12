using System.Text.Json;
using Npgsql;
using BeerApp.Api.Models;

namespace BeerApp.Api.Data;

// All databaskommunikation samlad på ett ställe. Ren SQL via Npgsql —
// medvetet utan ORM, för att hålla det enkelt och lätt att följa.
public class Db
{
    private readonly NpgsqlDataSource _dataSource;
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public Db(NpgsqlDataSource dataSource)
    {
        _dataSource = dataSource;
    }

    // Kör init.sql (skapar tabellerna om de inte redan finns). Körs vid uppstart.
    public async Task InitAsync()
    {
        var sqlPath = Path.Combine(AppContext.BaseDirectory, "Data", "init.sql");
        var sql = await File.ReadAllTextAsync(sqlPath);

        await using var conn = await _dataSource.OpenConnectionAsync();
        await using var cmd = new NpgsqlCommand(sql, conn);
        await cmd.ExecuteNonQueryAsync();
    }

    // ---------- Beers ----------

    public async Task<List<Beer>> GetBeersAsync()
    {
        const string sql = """
            SELECT b.id, b.name, b.brewery, b.created_at,
                   COALESCE(AVG(r.score), 0)::float AS avg_score,
                   COUNT(r.id)::int AS rating_count
            FROM beers b
            LEFT JOIN tastings t ON t.beer_id = b.id
            LEFT JOIN ratings r ON r.tasting_id = t.id
            GROUP BY b.id
            ORDER BY b.name ASC;
            """;

        await using var conn = await _dataSource.OpenConnectionAsync();
        await using var cmd = new NpgsqlCommand(sql, conn);
        await using var reader = await cmd.ExecuteReaderAsync();

        var beers = new List<Beer>();
        while (await reader.ReadAsync())
        {
            beers.Add(new Beer(
                reader.GetInt32(0),
                reader.GetString(1),
                reader.IsDBNull(2) ? null : reader.GetString(2),
                reader.GetDouble(4),
                reader.GetInt32(5),
                reader.GetDateTime(3)
            ));
        }
        return beers;
    }

    public async Task<Beer> CreateBeerAsync(string name, string? brewery)
    {
        const string sql = """
            INSERT INTO beers (name, brewery)
            VALUES (@name, @brewery)
            RETURNING id, name, brewery, created_at;
            """;

        await using var conn = await _dataSource.OpenConnectionAsync();
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("name", name);
        cmd.Parameters.AddWithValue("brewery", (object?)brewery ?? DBNull.Value);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();
        return new Beer(
            reader.GetInt32(0),
            reader.GetString(1),
            reader.IsDBNull(2) ? null : reader.GetString(2),
            0,
            0,
            reader.GetDateTime(3)
        );
    }

    // ---------- Tastings ----------

    public async Task<List<Tasting>> GetTastingsAsync()
    {
        const string sql = """
            SELECT t.id, t.beer_id, b.name, b.brewery, t.food, t.created_at,
                   COALESCE(AVG(r.score), 0)::float AS avg_score,
                   COALESCE(
                       json_agg(json_build_object('person', r.person, 'score', r.score::float))
                       FILTER (WHERE r.id IS NOT NULL),
                       '[]'
                   ) AS ratings
            FROM tastings t
            JOIN beers b ON b.id = t.beer_id
            LEFT JOIN ratings r ON r.tasting_id = t.id
            GROUP BY t.id, b.name, b.brewery
            ORDER BY t.created_at DESC;
            """;

        await using var conn = await _dataSource.OpenConnectionAsync();
        await using var cmd = new NpgsqlCommand(sql, conn);
        await using var reader = await cmd.ExecuteReaderAsync();

        var tastings = new List<Tasting>();
        while (await reader.ReadAsync())
        {
            var ratingsJson = reader.GetString(7);
            var ratings = JsonSerializer.Deserialize<List<RatingDto>>(ratingsJson, JsonOpts) ?? [];

            tastings.Add(new Tasting(
                reader.GetInt32(0),
                reader.GetInt32(1),
                reader.GetString(2),
                reader.IsDBNull(3) ? null : reader.GetString(3),
                reader.IsDBNull(4) ? null : reader.GetString(4),
                reader.GetDateTime(5),
                reader.GetDouble(6),
                ratings
            ));
        }
        return tastings;
    }

    // Skapar en provning i en transaktion: (ev. ny öl) + tasting-rad + 3 rating-rader.
    public async Task<Tasting> CreateTastingAsync(NewTastingRequest req)
    {
        await using var conn = await _dataSource.OpenConnectionAsync();
        await using var tx = await conn.BeginTransactionAsync();

        int beerId;
        if (req.BeerId is int existingBeerId)
        {
            beerId = existingBeerId;
        }
        else
        {
            const string insertBeerSql = """
                INSERT INTO beers (name, brewery) VALUES (@name, @brewery) RETURNING id;
                """;
            await using var beerCmd = new NpgsqlCommand(insertBeerSql, conn, tx);
            beerCmd.Parameters.AddWithValue("name", req.BeerName!);
            beerCmd.Parameters.AddWithValue("brewery", (object?)req.Brewery ?? DBNull.Value);
            beerId = (int)(await beerCmd.ExecuteScalarAsync())!;
        }

        const string insertTastingSql = """
            INSERT INTO tastings (beer_id, food) VALUES (@beerId, @food) RETURNING id, created_at;
            """;
        await using var tastingCmd = new NpgsqlCommand(insertTastingSql, conn, tx);
        tastingCmd.Parameters.AddWithValue("beerId", beerId);
        tastingCmd.Parameters.AddWithValue("food", req.Food);

        int tastingId;
        DateTime createdAt;
        await using (var reader = await tastingCmd.ExecuteReaderAsync())
        {
            await reader.ReadAsync();
            tastingId = reader.GetInt32(0);
            createdAt = reader.GetDateTime(1);
        }

        const string insertRatingSql = """
            INSERT INTO ratings (tasting_id, person, score) VALUES (@tastingId, @person, @score);
            """;
        foreach (var (person, score) in req.Scores)
        {
            await using var ratingCmd = new NpgsqlCommand(insertRatingSql, conn, tx);
            ratingCmd.Parameters.AddWithValue("tastingId", tastingId);
            ratingCmd.Parameters.AddWithValue("person", person);
            ratingCmd.Parameters.AddWithValue("score", Math.Round(score, 1));
            await ratingCmd.ExecuteNonQueryAsync();
        }

        await tx.CommitAsync();

        // Hämta beer-info för svaret
        const string beerInfoSql = "SELECT name, brewery FROM beers WHERE id = @id;";
        await using var beerInfoCmd = new NpgsqlCommand(beerInfoSql, conn);
        beerInfoCmd.Parameters.AddWithValue("id", beerId);
        string beerName;
        string? brewery;
        await using (var reader = await beerInfoCmd.ExecuteReaderAsync())
        {
            await reader.ReadAsync();
            beerName = reader.GetString(0);
            brewery = reader.IsDBNull(1) ? null : reader.GetString(1);
        }

        var ratingsList = req.Scores
            .Select(kv => new RatingDto(kv.Key, Math.Round(kv.Value, 1)))
            .ToList();
        var avg = ratingsList.Count > 0 ? ratingsList.Average(r => r.Score) : 0;

        return new Tasting(tastingId, beerId, beerName, brewery, req.Food, createdAt, avg, ratingsList);
    }

    // ---------- Stats ----------

    public async Task<List<PersonStat>> GetPersonStatsAsync()
    {
        const string sql = """
            SELECT person, AVG(score)::float AS avg_score, COUNT(*)::int AS count
            FROM ratings
            GROUP BY person
            ORDER BY avg_score DESC;
            """;

        await using var conn = await _dataSource.OpenConnectionAsync();
        await using var cmd = new NpgsqlCommand(sql, conn);
        await using var reader = await cmd.ExecuteReaderAsync();

        var stats = new List<PersonStat>();
        while (await reader.ReadAsync())
        {
            stats.Add(new PersonStat(reader.GetString(0), reader.GetDouble(1), reader.GetInt32(2)));
        }
        return stats;
    }
}
