import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomerStackParamList } from '../../types/navigation';
import apiClient from '../../api/client';
import { normalizeComment, normalizeMovie, normalizeShowtime, unwrapApiData } from '../../api/transformers';
import { Comment, Movie, Showtime } from '../../types/models';
import { socketService } from '../../services/socket';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');
const ACCENT = '#f90680';
const BACKGROUND = '#0f0a12';
const SURFACE = '#1a141e';
const MUTED = '#666';
const MUTED_LIGHT = '#aaa';

type Props = NativeStackScreenProps<CustomerStackParamList, 'MovieDetail'>;

interface TheaterGroup {
  id: string;
  theater: string;
  distance: string;
  type: string;
  showtimes: Showtime[];
}

export const MovieDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { movieId } = route.params;
  const { user } = useAuthStore();
  const [commentContent, setCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [selectedShowtimeId, setSelectedShowtimeId] = useState<string | null>(null);

  useEffect(() => {
    socketService.connect();
    socketService.joinMovieRoom(movieId);
    return () => {
      socketService.leaveMovieRoom(movieId);
      socketService.disconnect();
    };
  }, [movieId]);

  const { data: movie, isLoading: isLoadingMovie } = useQuery<Movie>({
    queryKey: ['movie', movieId],
    queryFn: async () => {
      return normalizeMovie(unwrapApiData(await apiClient.get(`/movies/${movieId}`)));
    },
  });

  const { data: showtimes = [], isLoading: isLoadingShowtimes } = useQuery<Showtime[]>({
    queryKey: ['showtimes', { movieId }],
    queryFn: async () => {
      const data = unwrapApiData<unknown[]>(await apiClient.get(`/showtimes?movie=${movieId}&status=scheduled`));
      return data.map(normalizeShowtime);
    },
  });

  const { data: comments, isLoading: isLoadingComments, refetch: refetchComments } = useQuery<Comment[]>({
    queryKey: ['comments', movieId],
    queryFn: async () => {
      const data = unwrapApiData<unknown[]>(await apiClient.get(`/comments/movies/${movieId}`));
      return data.map(normalizeComment);
    },
  });

  useEffect(() => {
    const handleRefresh = () => refetchComments();

    socketService.on('comments:new', handleRefresh);
    socketService.on('comments:reply', handleRefresh);
    socketService.on('comments:status', handleRefresh);

    return () => {
      socketService.off('comments:new', handleRefresh);
      socketService.off('comments:reply', handleRefresh);
      socketService.off('comments:status', handleRefresh);
    };
  }, [refetchComments]);

  useEffect(() => {
    if (!selectedShowtimeId && showtimes.length > 0) {
      setSelectedShowtimeId(showtimes[0].id);
    }
  }, [selectedShowtimeId, showtimes]);

  const handlePostComment = async () => {
    if (!commentContent.trim()) return;

    try {
      setIsSubmittingComment(true);
      await apiClient.post('/comments', {
        movie: movieId,
        content: commentContent,
        rating: 5,
      });
      setCommentContent('');
      refetchComments();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const theaterGroups = useMemo<TheaterGroup[]>(() => {
    const grouped = new Map<string, TheaterGroup>();

    showtimes.forEach((showtime) => {
      const cinema = showtime.screen?.cinema;
      const key = `${cinema?.id ?? 'cinema'}-${showtime.screen?.id ?? showtime.id}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          id: key,
          theater: cinema?.name ?? 'Cinema',
          distance: cinema?.location || cinema?.address || 'Now showing nearby',
          type: showtime.screen?.name || 'Standard Experience',
          showtimes: [],
        });
      }

      grouped.get(key)?.showtimes.push(showtime);
    });

    return Array.from(grouped.values());
  }, [showtimes]);

  const selectedShowtime = showtimes.find((showtime) => showtime.id === selectedShowtimeId) ?? showtimes[0];
  const locationLabel = theaterGroups[0]?.distance || 'Nearby theaters';

  const commentsContent = () => {
    if (isLoadingComments) {
      return <ActivityIndicator color={ACCENT} style={styles.commentsLoader} />;
    }

    if (!comments || comments.length === 0) {
      return <Text style={styles.emptyText}>No comments yet. Be the first!</Text>;
    }

    return comments.map((comment) => (
      <View key={comment.id} style={styles.commentCard}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>{comment.user?.fullName || 'Anonymous'}</Text>
          <Text style={styles.commentDate}>
            {new Date(comment.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>
        <Text style={styles.commentText}>{comment.content}</Text>

        {comment.replies && comment.replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {comment.replies.map((reply) => (
              <View key={reply.id} style={styles.replyCard}>
                <Text style={styles.replyAuthor}>{reply.user?.fullName || 'Staff'}</Text>
                <Text style={styles.replyText}>{reply.content}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    ));
  };

  if (isLoadingMovie || !movie) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <ImageBackground
            source={{
              uri:
                movie.posterUrl ||
                'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800',
            }}
            style={styles.heroImage}
          >
            <LinearGradient
              colors={['rgba(15, 10, 18, 0.3)', BACKGROUND]}
              style={styles.heroGradient}
            >
              <View style={styles.headerControls}>
                <TouchableOpacity style={styles.iconCircle} onPress={() => navigation.goBack()}>
                  <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconCircle}>
                  <MaterialCommunityIcons name="heart-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.movieTitleContainer}>
                <Text style={styles.movieTitle}>{movie.title}</Text>
                <View style={styles.metaContainer}>
                  <View style={styles.ratingBox}>
                    <MaterialCommunityIcons name="star" size={16} color={ACCENT} />
                    <Text style={styles.ratingText}>{(movie.rating ?? 4.8).toFixed(1)}</Text>
                  </View>
                  <Text style={styles.metaText}>
                    • {(movie.genre && movie.genre.length > 0 ? movie.genre.slice(0, 2).join(' / ') : 'Cinema')} • {movie.duration}m •
                  </Text>
                  <View style={styles.pgBadge}>
                    <Text style={styles.pgText}>{new Date(movie.releaseDate).getFullYear()}</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>

          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Synopsis</Text>
            <Text style={styles.synopsisText}>{movie.description}</Text>
          </View>

          <View style={styles.contentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Nearby Theaters</Text>
              <View style={styles.locationButton}>
                <MaterialCommunityIcons name="map-marker" size={16} color={ACCENT} />
                <Text style={styles.locationText}>{locationLabel}</Text>
              </View>
            </View>

            {isLoadingShowtimes ? (
              <ActivityIndicator color={ACCENT} style={styles.commentsLoader} />
            ) : theaterGroups.length > 0 ? (
              theaterGroups.map((theater) => (
                <View key={theater.id} style={styles.theaterCard}>
                  <View style={styles.theaterHeader}>
                    <View style={styles.theaterInfo}>
                      <Text style={styles.theaterName}>{theater.theater}</Text>
                      <Text style={styles.distanceText}>{theater.distance}</Text>
                    </View>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeText}>{theater.type}</Text>
                    </View>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                    {theater.showtimes
                      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                      .map((showtime) => {
                        const isActive = selectedShowtimeId === showtime.id;
                        return (
                          <TouchableOpacity
                            key={showtime.id}
                            style={[styles.timeSlot, isActive && styles.activeTimeSlot]}
                            onPress={() => setSelectedShowtimeId(showtime.id)}
                          >
                            <Text style={[styles.timeText, isActive && styles.activeTimeText]}>
                              {new Date(showtime.startTime).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                              })}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                  </ScrollView>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No upcoming showtimes.</Text>
            )}
          </View>

          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Comments</Text>

            {user?.role === 'CUSTOMER' && (
              <View style={styles.addCommentBox}>
                <Input
                  placeholder="Share your thoughts..."
                  value={commentContent}
                  onChangeText={setCommentContent}
                  multiline
                  style={styles.commentInput}
                />
                <Button title="Post Comment" onPress={handlePostComment} isLoading={isSubmittingComment} />
              </View>
            )}

            {commentsContent()}
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.bookButton, !selectedShowtime && styles.bookButtonDisabled]}
            onPress={() => selectedShowtime && navigation.navigate('SeatSelection', { showtimeId: selectedShowtime.id })}
            disabled={!selectedShowtime}
          >
            <Text style={styles.bookButtonText}>Select Seats</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  heroImage: {
    width,
    height: 500,
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 10, 18, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  movieTitleContainer: {
    paddingHorizontal: 20,
  },
  movieTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 40,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    flexWrap: 'wrap',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(249, 6, 128, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    color: ACCENT,
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 14,
  },
  metaText: {
    color: MUTED_LIGHT,
    fontSize: 14,
    marginLeft: 8,
  },
  pgBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  pgText: {
    color: ACCENT,
    fontSize: 10,
    fontWeight: 'bold',
  },
  contentSection: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  synopsisText: {
    color: MUTED_LIGHT,
    fontSize: 15,
    lineHeight: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    gap: 12,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  locationText: {
    color: ACCENT,
    fontSize: 14,
    marginLeft: 4,
  },
  theaterCard: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
  },
  theaterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
    gap: 10,
  },
  theaterInfo: {
    flex: 1,
  },
  theaterName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  distanceText: {
    color: MUTED,
    fontSize: 12,
    marginTop: 2,
  },
  typeBadge: {
    backgroundColor: 'rgba(249, 6, 128, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    color: ACCENT,
    fontSize: 10,
    fontWeight: 'bold',
  },
  timeScroll: {
    flexDirection: 'row',
  },
  timeSlot: {
    backgroundColor: BACKGROUND,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  activeTimeSlot: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  timeText: {
    color: '#fff',
    fontWeight: '600',
  },
  activeTimeText: {
    color: '#fff',
  },
  addCommentBox: {
    marginBottom: 18,
  },
  commentInput: {
    height: 90,
    textAlignVertical: 'top',
  },
  commentsLoader: {
    marginVertical: 24,
  },
  commentCard: {
    backgroundColor: SURFACE,
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  commentAuthor: {
    color: '#fff',
    fontWeight: 'bold',
  },
  commentDate: {
    color: MUTED,
    fontSize: 12,
  },
  commentText: {
    color: '#fff',
    lineHeight: 20,
  },
  repliesContainer: {
    marginTop: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#2c2331',
  },
  replyCard: {
    marginTop: 8,
  },
  replyAuthor: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: 'bold',
  },
  replyText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 2,
  },
  emptyText: {
    color: MUTED_LIGHT,
    fontStyle: 'italic',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(15, 10, 18, 0.92)',
  },
  bookButton: {
    backgroundColor: ACCENT,
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  bookButtonDisabled: {
    opacity: 0.5,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

