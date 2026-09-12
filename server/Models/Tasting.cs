namespace BeerApp.Api.Models;

// Ett enskilt betyg från en person, kopplat till en provning.
public record RatingDto(string Person, double Score);

// En "provning" = en öl + mat + tre betyg (Adam, Emil, Victor).
public record Tasting(
    int Id,
    int BeerId,
    string BeerName,
    string? Brewery,
    string? Food,
    DateTime CreatedAt,
    double AvgScore,
    List<RatingDto> Ratings
);

// De tre fasta personerna i appen.
public static class Persons
{
    public static readonly string[] All = ["Adam", "Emil", "Victor"];
}

// Inkommande data när man registrerar en ny provning.
// Antingen BeerId (befintlig öl) ELLER BeerName (skapar en ny öl) ska skickas.
public record NewTastingRequest(
    int? BeerId,
    string? BeerName,
    string? Brewery,
    string Food,
    Dictionary<string, double> Scores
);

// Inkommande data när man redigerar en befintlig provning (mat, betyg, samt
// ölens namn/bryggeri — som uppdaterar själva öl-raden, inte bara provningen).
public record UpdateTastingRequest(string Food, Dictionary<string, double> Scores, string BeerName, string? Brewery);

public record PersonStat(string Person, double AvgScore, int Count);
