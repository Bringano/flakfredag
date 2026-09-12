namespace BeerApp.Api.Models;

// En kväll ni träffats (loggboken) — datum, valfri kort beskrivning, och id:n
// på tillhörande bilder. Bildernas rådata skickas inte med här; de hämtas var
// för sig via GET /api/gatherings/{gatheringId}/photos/{photoId}.
public record Gathering(int Id, DateOnly OccurredOn, string? Description, DateTime CreatedAt, List<int> PhotoIds);

// En bilds rådata + content-type, för att kunna serveras med rätt MIME-typ.
public record GatheringPhoto(byte[] Data, string ContentType);
