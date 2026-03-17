import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import apiClient from '../../api/client';
import { Movie, Showtime, Comment } from '../../types/models';
import { theme } from '../../constants/theme';
import { socketService } from '../../services/socket';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useAuthStore } from '../../store/authStore';

type Props = NativeStackScreenProps<RootStackParamList, 'MovieDetail'>;

interface GroupedShowtimes {
  [date: string]: Showtime[];
}

export const MovieDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { movieId } = route.params;
  const { user } = useAuthStore();
  const [commentContent, setCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Join Socket.io room on mount
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
      const { data } = await apiClient.get(`/movies/${movieId}`);
      return data;
    },
  });

  const { data: showtimes, isLoading: isLoadingShowtimes } = useQuery<Showtime[]>({
    queryKey: ['showtimes', { movieId }],
    queryFn: async () => {
      const { data } = await apiClient.get(`/showtimes?movieId=${movieId}`);
      return data;
    },
  });

  const { data: comments, isLoading: isLoadingComments, refetch: refetchComments } = useQuery<Comment[]>({
    queryKey: ['comments', movieId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/comments/movies/${movieId}`);
      return data;
    },
  });

  // Listen for socket events
  useEffect(() => {
    const handleNewComment = () => refetchComments();
    const handleCommentReply = () => refetchComments();
    const handleCommentStatus = () => refetchComments();

    socketService.on('comments:new', handleNewComment);
    socketService.on('comments:reply', handleCommentReply);
    socketService.on('comments:status', handleCommentStatus);

    return () => {
      socketService.off('comments:new', handleNewComment);
      socketService.off('comments:reply', handleCommentReply);
      socketService.off('comments:status', handleCommentStatus);
    };
  }, [refetchComments]);

  const handlePostComment = async () => {
    if (!commentContent.trim()) return;
    try {
      setIsSubmittingComment(true);
      await apiClient.post('/comments', {
        movieId,
        content: commentContent,
        rating: 5, // Hardcoded for this demo, assume a star rating component exists
      });
      setCommentContent('');
      refetchComments();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const groupedShowtimes = showtimes?.reduce<GroupedShowtimes>((acc, showtime) => {
    const date = new Date(showtime.startTime).toISOString().split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(showtime);
    return acc;
  }, {});

  const renderShowtimes = () => {
    if (isLoadingShowtimes) return <ActivityIndicator color={theme.colors.primary} />;
    if (!groupedShowtimes || Object.keys(groupedShowtimes).length === 0) {
      return <Text style={styles.emptyText}>No upcoming showtimes.</Text>;
    }

    return Object.entries(groupedShowtimes).map(([date, times]) => {
      const displayDate = new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
      return (
      <View key={date} style={styles.showtimeGroup}>
        <Text style={styles.showtimeDate}>{displayDate}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.showtimeRow}>
          {times.map((st) => (
            <TouchableOpacity
              key={st.id}
              style={styles.showtimePill}
              onPress={() => navigation.navigate('ShowtimeDetail', { showtimeId: st.id })}
            >
              <Text style={styles.showtimeTime}>
                {new Date(st.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </Text>
              <Text style={styles.showtimeScreen}>{st.screen?.cinema?.name ?? 'Cinema'}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    )});
  };

  const renderComments = () => {
    if (isLoadingComments) return <ActivityIndicator color={theme.colors.primary} />;
    if (!comments || comments.length === 0) {
      return <Text style={styles.emptyText}>No comments yet. Be the first!</Text>;
    }

    return comments.map((comment) => (
      <View key={comment.id} style={styles.commentCard}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>{comment.user?.fullName || 'Anonymous'}</Text>
          <Text style={styles.commentDate}>
            {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>
        <Text style={styles.commentText}>{comment.content}</Text>
        
        {/* Replies block */}
        {comment.replies && comment.replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {comment.replies.map(reply => (
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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {movie.posterUrl ? (
          <Image source={{ uri: movie.posterUrl }} style={styles.heroImage} />
        ) : (
          <View style={[styles.heroImage, styles.heroPlaceholder]}>
            <Text style={styles.placeholderText}>No Poster</Text>
          </View>
        )}

        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{movie.title}</Text>
          <Text style={styles.subtitle}>
            {movie.duration} mins • Released: {new Date(movie.releaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
          <Text style={styles.description}>{movie.description}</Text>

          {/* Showtimes Section */}
          <Text style={styles.sectionTitle}>Showtimes</Text>
          {renderShowtimes()}

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.sectionTitle}>Comments</Text>
            
            {user?.role === 'CUSTOMER' && (
              <View style={styles.addCommentBox}>
                <Input
                  placeholder="Share your thoughts..."
                  value={commentContent}
                  onChangeText={setCommentContent}
                  multiline
                  style={{ height: 80, textAlignVertical: 'top' }}
                />
                <Button 
                  title="Post Comment" 
                  onPress={handlePostComment}
                  isLoading={isSubmittingComment}
                />
              </View>
            )}

            {renderComments()}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  heroImage: {
    width: '100%',
    height: 250,
  },
  heroPlaceholder: {
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: theme.colors.textSecondary,
  },
  detailsContainer: {
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  description: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  showtimeGroup: {
    marginBottom: theme.spacing.md,
  },
  showtimeDate: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
    marginBottom: theme.spacing.xs,
  },
  showtimeRow: {
    flexDirection: 'row',
  },
  showtimePill: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    marginRight: theme.spacing.sm,
    alignItems: 'center',
  },
  showtimeTime: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: theme.typography.sizes.md,
  },
  showtimeScreen: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: theme.typography.sizes.xs,
    marginTop: 2,
  },
  commentsSection: {
    marginTop: theme.spacing.lg,
  },
  addCommentBox: {
    marginBottom: theme.spacing.lg,
  },
  commentCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  commentAuthor: {
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  commentDate: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.xs,
  },
  commentText: {
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  repliesContainer: {
    marginTop: theme.spacing.md,
    paddingLeft: theme.spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.surfaceLight,
  },
  replyCard: {
    marginTop: theme.spacing.sm,
  },
  replyAuthor: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.xs,
    fontWeight: 'bold',
  },
  replyText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.sm,
  },
});
