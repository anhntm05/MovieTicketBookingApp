import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { normalizeComment, unwrapApiData } from '../../api/transformers';
import { Comment } from '../../types/models';
import { theme } from '../../constants/theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

export const CommentsScreen = () => {
  const queryClient = useQueryClient();
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const { data: comments, isLoading } = useQuery<Comment[]>({
    queryKey: ['manage-comments'],
    queryFn: async () => {
      const data = unwrapApiData<unknown[]>(await apiClient.get('/comments/manage'));
      return data.map(normalizeComment);
    },
  });

  const replyMutation = useMutation({
    mutationFn: async (payload: { commentId: string, content: string }) => {
      return apiClient.post(`/comments/${payload.commentId}/replies`, { content: payload.content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manage-comments'] });
      setReplyModalVisible(false);
      setReplyContent('');
      setSelectedComment(null);
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.message || 'Failed to reply'),
  });

  const handleReplySubmit = () => {
    if (!selectedComment || !replyContent.trim()) return;
    replyMutation.mutate({ commentId: selectedComment.id, content: replyContent });
  };

  const renderItem = ({ item }: { item: Comment }) => (
    <View style={styles.card}>
      <Text style={styles.commentAuthor}>{item.user?.fullName || item.userId} • {item.status}</Text>
      <Text style={styles.commentContent}>"{item.content}"</Text>
      
      <View style={styles.actionsBox}>
        <Button 
          title="Reply" 
          variant="outline"
          style={styles.replyBtn} 
          onPress={() => {
            setSelectedComment(item);
            setReplyModalVisible(true);
          }} 
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Customer Comments</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Reply Modal */}
      <Modal visible={replyModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Reply to Comment</Text>
          {selectedComment && (
            <View style={styles.originalCommentBox}>
              <Text style={styles.commentAuthor}>{selectedComment.user?.fullName}</Text>
              <Text style={{color: theme.colors.textSecondary}}>"{selectedComment.content}"</Text>
            </View>
          )}

          <Input 
            label="Your Reply" 
            value={replyContent} 
            onChangeText={setReplyContent} 
            multiline 
            style={{ height: 100, textAlignVertical: 'top' }}
          />

          <View style={styles.modalActions}>
            <Button title="Cancel" variant="outline" onPress={() => setReplyModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
            <Button title="Send Reply" onPress={handleReplySubmit} isLoading={replyMutation.isPending} style={{ flex: 1 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    padding: theme.spacing.md,
    paddingTop: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
  },
  headerTitle: { fontSize: theme.typography.sizes.xl, fontWeight: 'bold', color: theme.colors.text },
  list: { padding: theme.spacing.md },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  commentAuthor: { color: theme.colors.text, fontSize: theme.typography.sizes.sm, fontWeight: 'bold' },
  commentContent: { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.md, marginVertical: theme.spacing.sm },
  actionsBox: { flexDirection: 'row', justifyContent: 'flex-end' },
  replyBtn: { height: 36, paddingHorizontal: theme.spacing.md },
  modalContainer: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.xl, paddingTop: 60 },
  modalTitle: { fontSize: theme.typography.sizes.xl, fontWeight: 'bold', color: theme.colors.text, marginBottom: 20 },
  originalCommentBox: { backgroundColor: theme.colors.surface, padding: theme.spacing.md, borderRadius: theme.borderRadius.md, marginBottom: theme.spacing.xl },
  modalActions: { flexDirection: 'row', marginTop: theme.spacing.xl },
});
