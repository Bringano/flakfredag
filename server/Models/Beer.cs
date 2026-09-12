namespace BeerApp.Api.Models;

// Öl med uträknat snittbetyg och antal röster, för topplistan.
public record Beer(
    int Id,
    string Name,
    string? Brewery,
    double AvgScore,
    int RatingCount,
    DateTime CreatedAt
);

public record NewBeerRequest(string Name, string? Brewery);
