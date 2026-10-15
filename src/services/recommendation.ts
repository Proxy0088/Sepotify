import { Track } from '../types/music';

export interface RecommendationScore {
  track: Track;
  score: number;
  reason: string;
}

export function calculatePersonalizedRecommendations(
  allTracks: Track[],
  likedTrackIds: string[],
  playCounts: Record<string, number>
): RecommendationScore[] {
  // 1. Calculate genre affinity weights
  const genreWeights: Record<string, number> = {};

  likedTrackIds.forEach((id) => {
    const track = allTracks.find((t) => t.id === id);
    if (track) {
      genreWeights[track.genre] = (genreWeights[track.genre] || 0) + 3.0;
    }
  });

  Object.entries(playCounts).forEach(([id, count]) => {
    const track = allTracks.find((t) => t.id === id);
    if (track) {
      genreWeights[track.genre] = (genreWeights[track.genre] || 0) + count * 1.5;
    }
  });

  // Find top genre if any
  let topGenre = '';
  let maxWeight = 0;
  Object.entries(genreWeights).forEach(([genre, weight]) => {
    if (weight > maxWeight) {
      maxWeight = weight;
      topGenre = genre;
    }
  });

  // 2. Score every track
  const scored = allTracks.map((track) => {
    const isLiked = likedTrackIds.includes(track.id);
    const count = playCounts[track.id] || 0;
    const genreBonus = genreWeights[track.genre] || 0;

    let score = (genreBonus * 2.0) + (count * 1.2);
    let reason = 'بر اساس بیشترین محبوبیت و پخش';

    if (isLiked) {
      score += 5.0;
      reason = 'آهنگ لایک‌شده شما';
    } else if (track.genre === topGenre) {
      score += 4.0;
      reason = `بر اساس علاقه شما به سبک ${track.genre}`;
    } else if (genreBonus > 0) {
      score += 2.0;
      reason = `متناسب با سلیقه شما در ژانر ${track.genre}`;
    } else if (track.plays && track.plays > 1000000) {
      score += 1.5;
      reason = 'ترک پرطرفدار در بین کاربران';
    }

    // Add tiny random variance to make dynamic fresh mixes
    score += (track.title.length % 5) * 0.2;

    return {
      track,
      score,
      reason,
    };
  });

  // Sort descending by score
  return scored.sort((a, b) => b.score - a.score);
}

export function getSimilarTracks(currentTrack: Track, allTracks: Track[], limit = 6): Track[] {
  return allTracks
    .filter((t) => t.id !== currentTrack.id)
    .map((t) => {
      let sim = 0;
      if (t.genre === currentTrack.genre) sim += 5;
      if (t.artist === currentTrack.artist) sim += 4;
      if (Math.abs(t.duration - currentTrack.duration) < 30) sim += 1;
      return { track: t, similarity: sim };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map((item) => item.track);
}
