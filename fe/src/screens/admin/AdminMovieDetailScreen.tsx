import React, { useEffect, useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { normalizeMovie, resolveMediaUrl, unwrapApiData } from '../../api/transformers';
import { theme } from '../../constants/theme';
import { Movie, MovieContentRating } from '../../types/models';
import { AdminMovieStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<AdminMovieStackParamList, 'AdminMovieDetail'>;

type MovieFormState = {
  title: string;
  description: string;
  genres: string;
  duration: string;
  rating: string;
  contentRating: MovieContentRating;
  releaseDate: string;
  posterUrl: string;
  trailerUrl: string;
  status: Movie['status'];
};

const CONTENT_RATINGS: MovieContentRating[] = ['G', 'PG', 'PG-13', 'R', 'NC-17'];
const DEFAULT_POSTER_URL = 'https://placehold.co/400x600/png';
const DEFAULT_TRAILER_URL = 'https://example.com/trailer';

const todayInputValue = () => new Date().toISOString().slice(0, 10);

const isValidUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const createDefaultForm = (): MovieFormState => ({
  title: '',
  description: '',
  genres: '',
  duration: '',
  rating: '8.0',
  contentRating: 'PG-13',
  releaseDate: todayInputValue(),
  posterUrl: '',
  trailerUrl: '',
  status: 'DRAFT',
});

const formatDateLabel = (value?: string) => {
  if (!value) return 'Not scheduled';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const toFormState = (movie?: Movie | null): MovieFormState => {
  if (!movie) return createDefaultForm();

  return {
    title: movie.title || '',
    description: movie.description || '',
    genres: movie.genre?.join(', ') || '',
    duration: movie.duration ? String(movie.duration) : '',
    rating: movie.rating ? String(movie.rating) : '8.0',
    contentRating: movie.contentRating || 'PG-13',
    releaseDate: movie.releaseDate ? movie.releaseDate.slice(0, 10) : todayInputValue(),
    posterUrl: movie.posterUrl || '',
    trailerUrl: movie.trailerUrl || '',
    status: movie.status || 'DRAFT',
  };
};

const parseGenres = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const validateForm = (form: MovieFormState) => {
  if (!form.title.trim()) return 'Movie title is required.';
  if (!form.description.trim()) return 'Synopsis is required.';
  if (!parseGenres(form.genres).length) return 'Enter at least one genre.';

  const duration = Number(form.duration);
  if (!Number.isInteger(duration) || duration <= 0) return 'Duration must be a positive whole number.';

  const rating = Number(form.rating);
  if (Number.isNaN(rating) || rating < 0 || rating > 10) return 'Audience rating must be between 0 and 10.';

  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.releaseDate)) return 'Release date must use YYYY-MM-DD.';
  if (Number.isNaN(new Date(`${form.releaseDate}T00:00:00.000Z`).getTime())) return 'Release date is invalid.';

  if (form.posterUrl.trim() && !isValidUrl(form.posterUrl.trim())) return 'Poster URL must be a valid http(s) URL.';
  if (form.trailerUrl.trim() && !isValidUrl(form.trailerUrl.trim())) return 'Trailer URL must be a valid http(s) URL.';

  return null;
};

const buildPayload = (form: MovieFormState, movie?: Movie) => {
  const posterUrl = form.posterUrl.trim();
  const trailerUrl = form.trailerUrl.trim();

  return {
    title: form.title.trim(),
    description: form.description.trim(),
    duration: Number(form.duration),
    genre: parseGenres(form.genres),
    rating: Number(form.rating) || movie?.rating || 8,
    contentRating: form.contentRating.toLowerCase(),
    poster: posterUrl || movie?.posterUrl || DEFAULT_POSTER_URL,
    trailer: trailerUrl || movie?.trailerUrl || DEFAULT_TRAILER_URL,
    releaseDate: new Date(`${form.releaseDate}T00:00:00.000Z`).toISOString(),
    status: form.status.toLowerCase(),
  };
};

const getErrorMessage = (error: any) => {
  if (typeof error?.response?.data === 'string' && error.response.data.trim()) {
    return error.response.data;
  }

  if (Array.isArray(error?.response?.data?.errors) && error.response.data.errors.length) {
    return String(error.response.data.errors[0]);
  }

  if (error?.response?.data?.message) {
    return String(error.response.data.message);
  }

  if (error?.message) {
    return String(error.message);
  }

  return 'Please try again.';
};

export const AdminMovieDetailScreen = ({ navigation, route }: Props) => {
  const queryClient = useQueryClient();
  const movieId = route.params?.movieId;
  const isCreateMode = !movieId;
  const [form, setForm] = useState<MovieFormState>(createDefaultForm());
  const [initialForm, setInitialForm] = useState<MovieFormState>(createDefaultForm());

  const { data: movie, isLoading } = useQuery<Movie>({
    queryKey: ['admin-movie-detail', movieId],
    enabled: Boolean(movieId),
    queryFn: async () => {
      const data = unwrapApiData(await apiClient.get(`/movies/${movieId}`));
      return normalizeMovie(data);
    },
  });

  useEffect(() => {
    const nextForm = toFormState(movie);
    setForm(nextForm);
    setInitialForm(nextForm);
  }, [movieId, movie]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = buildPayload(form, movie);

      if (movieId) {
        return apiClient.put(`/movies/${movieId}`, payload);
      }

      return apiClient.post('/movies', payload);
    },
    onSuccess: async (response) => {
      const savedMovie = normalizeMovie(unwrapApiData(response));
      const nextForm = toFormState(savedMovie);

      setForm(nextForm);
      setInitialForm(nextForm);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-movie-catalog'] }),
        queryClient.invalidateQueries({ queryKey: ['staff-movies'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] }),
      ]);

      if (!movieId) {
        navigation.replace('AdminMovieDetail', { movieId: savedMovie.id });
      }

      Alert.alert('Saved', `${savedMovie.title || 'Movie'} has been saved.`);
    },
    onError: (error: any) => {
      console.error('Movie save error', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      Alert.alert('Unable to save movie', getErrorMessage(error));
    },
  });

  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initialForm), [form, initialForm]);
  const isPublished = form.status === 'PUBLISHED';
  const previewPoster = resolveMediaUrl(form.posterUrl);

  const handleChange = <K extends keyof MovieFormState>(key: K, value: MovieFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('AdminMovieCatalog');
  };

  const handleDiscard = () => {
    if (!isDirty) {
      handleBack();
      return;
    }

    setForm(initialForm);
  };

  const handleSave = () => {
    const validationError = validateForm(form);

    if (validationError) {
      Alert.alert('Check the form', validationError);
      return;
    }

    saveMutation.mutate();
  };

  if (!isCreateMode && isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.85}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerLabel}>{isCreateMode ? 'CREATE MODE' : 'EDITOR MODE'}</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {(form.title || 'Untitled release').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.posterContainer}>
        {previewPoster ? (
          <Image source={{ uri: previewPoster }} style={styles.posterImage} />
        ) : (
          <View style={[styles.posterImage, styles.posterFallback]}>
            <MaterialCommunityIcons name="image-off-outline" size={42} color="#7f7189" />
          </View>
        )}
        <View style={styles.posterOverlay}>
          <View style={styles.uploadCircle}>
            <MaterialCommunityIcons name="movie-open-edit-outline" size={30} color={theme.colors.primary} />
          </View>
          <Text style={styles.uploadTitle}>{previewPoster ? 'Poster Preview' : 'Poster Pending'}</Text>
          <Text style={styles.uploadSub}>Paste a poster URL below. If you leave it empty, a placeholder poster will be used.</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.indicator, { backgroundColor: form.status === 'PUBLISHED' ? theme.colors.success : theme.colors.warning }]} />
          <View>
            <Text style={styles.statLabel}>STATUS</Text>
            <Text style={styles.statValue}>{form.status}</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.indicator, { backgroundColor: theme.colors.primary }]} />
          <View>
            <Text style={styles.statLabel}>RELEASE</Text>
            <Text style={styles.statValue}>{formatDateLabel(form.releaseDate)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.inputLabel}>MOVIE TITLE</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={form.title}
            onChangeText={(value) => handleChange('title', value)}
            placeholder="Enter movie title"
            placeholderTextColor="#666"
          />
        </View>

        <Text style={styles.inputLabel}>SYNOPSIS</Text>
        <View style={[styles.inputContainer, styles.multilineContainer]}>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={form.description}
            onChangeText={(value) => handleChange('description', value)}
            multiline
            textAlignVertical="top"
            placeholder="Describe the movie"
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.gridRow}>
          <View style={styles.halfFieldLeft}>
            <Text style={styles.inputLabel}>GENRES</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={form.genres}
                onChangeText={(value) => handleChange('genres', value)}
                placeholder="Sci-Fi, Thriller"
                placeholderTextColor="#666"
              />
            </View>
          </View>
          <View style={styles.halfFieldRight}>
            <Text style={styles.inputLabel}>DURATION (MINS)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={form.duration}
                onChangeText={(value) => handleChange('duration', value)}
                keyboardType="number-pad"
                placeholder="128"
                placeholderTextColor="#666"
              />
            </View>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.halfFieldLeft}>
            <Text style={styles.inputLabel}>AUDIENCE RATING (0-10)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={form.rating}
                onChangeText={(value) => handleChange('rating', value)}
                keyboardType="decimal-pad"
                placeholder="8.5"
                placeholderTextColor="#666"
              />
            </View>
          </View>
          <View style={styles.halfFieldRight}>
            <Text style={styles.inputLabel}>RELEASE DATE</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={form.releaseDate}
                onChangeText={(value) => handleChange('releaseDate', value)}
                autoCapitalize="none"
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#666"
              />
            </View>
          </View>
        </View>

        <Text style={styles.inputLabel}>CONTENT RATING</Text>
        <View style={styles.ratingRow}>
          {CONTENT_RATINGS.map((rating) => {
            const isActive = form.contentRating === rating;

            return (
              <TouchableOpacity
                key={rating}
                style={[styles.ratingTab, isActive && styles.activeRatingTab]}
                activeOpacity={0.85}
                onPress={() => handleChange('contentRating', rating)}
              >
                <Text style={[styles.ratingText, isActive && styles.activeRatingText]}>{rating}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.inputLabel}>POSTER URL</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={form.posterUrl}
            onChangeText={(value) => handleChange('posterUrl', value)}
            autoCapitalize="none"
            placeholder="https://example.com/poster.jpg"
            placeholderTextColor="#666"
          />
        </View>

        <Text style={styles.inputLabel}>TRAILER URL</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={form.trailerUrl}
            onChangeText={(value) => handleChange('trailerUrl', value)}
            autoCapitalize="none"
            placeholder="https://example.com/trailer.mp4"
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.inputLabel}>VISIBILITY STATUS</Text>
            <Text style={styles.toggleDesc}>{isPublished ? 'Published' : form.status === 'ARCHIVED' ? 'Archived' : 'Draft'}</Text>
          </View>
          <Switch
            value={isPublished}
            onValueChange={(value) => handleChange('status', value ? 'PUBLISHED' : 'DRAFT')}
            trackColor={{ false: '#333', true: '#f9068050' }}
            thumbColor={isPublished ? theme.colors.primary : '#666'}
          />
        </View>

        <View style={styles.statusActions}>
          {(['DRAFT', 'PUBLISHED', 'ARCHIVED'] as Movie['status'][]).map((status) => {
            const isActive = form.status === status;

            return (
              <TouchableOpacity
                key={status}
                style={[styles.statusChip, isActive && styles.statusChipActive]}
                activeOpacity={0.85}
                onPress={() => handleChange('status', status)}
              >
                <Text style={[styles.statusChipText, isActive && styles.statusChipTextActive]}>{status}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.9} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? (
            <ActivityIndicator color={theme.colors.text} />
          ) : (
            <Text style={styles.saveText}>{isCreateMode ? 'CREATE MOVIE' : 'SAVE CHANGES'}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.discardButton} onPress={handleDiscard} activeOpacity={0.9}>
          <Text style={styles.discardText}>{isDirty ? 'DISCARD CHANGES' : 'BACK TO CATALOG'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerCopy: {
    flex: 1,
    marginHorizontal: 14,
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#1a141e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLabel: {
    color: theme.colors.primary,
    fontSize: 10,
    fontFamily: theme.typography.fontFamilies.bold,
    letterSpacing: 1.4,
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontFamily: theme.typography.fontFamilies.bold,
    marginTop: 4,
  },
  posterContainer: {
    height: 360,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 28,
    backgroundColor: '#1a141e',
  },
  posterImage: {
    width: '100%',
    height: '100%',
    opacity: 0.45,
  },
  posterFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 28,
  },
  uploadCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f9068020',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontFamily: theme.typography.fontFamilies.bold,
  },
  uploadSub: {
    color: '#b2a8b8',
    fontSize: 12,
    fontFamily: theme.typography.fontFamilies.medium,
    textAlign: 'center',
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a141e',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#251d2a',
  },
  indicator: {
    width: 4,
    height: 44,
    borderRadius: 2,
    marginRight: 14,
  },
  statLabel: {
    color: '#807489',
    fontSize: 10,
    fontFamily: theme.typography.fontFamilies.bold,
    letterSpacing: 1,
  },
  statValue: {
    color: theme.colors.text,
    fontSize: 18,
    fontFamily: theme.typography.fontFamilies.bold,
    marginTop: 6,
  },
  formSection: {
    backgroundColor: '#1a141e',
    borderRadius: 30,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#241c29',
  },
  inputLabel: {
    color: theme.colors.primary,
    fontSize: 10,
    fontFamily: theme.typography.fontFamilies.bold,
    marginBottom: 12,
    letterSpacing: 1.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f0a12',
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 56,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#251d2a',
  },
  multilineContainer: {
    height: 132,
    alignItems: 'flex-start',
    paddingTop: 14,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: theme.typography.fontFamilies.medium,
  },
  multilineInput: {
    height: '100%',
  },
  gridRow: {
    flexDirection: 'row',
    marginHorizontal: -6,
  },
  halfFieldLeft: {
    flex: 1,
    marginHorizontal: 6,
  },
  halfFieldRight: {
    flex: 1,
    marginHorizontal: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  ratingTab: {
    minWidth: 66,
    height: 48,
    backgroundColor: '#0f0a12',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#251d2a',
  },
  activeRatingTab: {
    backgroundColor: '#251d2a',
    borderColor: theme.colors.primary,
  },
  ratingText: {
    color: '#8c8192',
    fontFamily: theme.typography.fontFamilies.bold,
  },
  activeRatingText: {
    color: theme.colors.text,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  toggleDesc: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: theme.typography.fontFamilies.medium,
    marginTop: 4,
  },
  statusActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  statusChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a212f',
    backgroundColor: '#120d15',
  },
  statusChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#2a1723',
  },
  statusChipText: {
    color: '#8c8192',
    fontSize: 12,
    fontFamily: theme.typography.fontFamilies.bold,
  },
  statusChipTextActive: {
    color: theme.colors.text,
  },
  actions: {
    gap: 14,
    paddingBottom: 8,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  saveText: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: theme.typography.fontFamilies.bold,
  },
  discardButton: {
    height: 58,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#251d2a',
    backgroundColor: '#1a141e',
  },
  discardText: {
    color: '#a396ab',
    fontSize: 15,
    fontFamily: theme.typography.fontFamilies.bold,
  },
});

