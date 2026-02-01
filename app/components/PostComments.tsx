import React, { useState, useEffect } from "react"
import { View, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native"
import { Text } from "./Text"
import { Icon } from "./Icon"
import { getPostComments, addComment, type Comment } from "@/services/feedService"
import { useAuth } from "@/context/AuthContext"

interface PostCommentsProps {
  groupId: string
  postId: string
}

export const PostComments: React.FC<PostCommentsProps> = ({ groupId, postId }) => {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingComments, setLoadingComments] = useState(true)
  const { userData } = useAuth()

  useEffect(() => {
    loadComments()
  }, [groupId, postId])

  const loadComments = async () => {
    try {
      setLoadingComments(true)
      const postComments = await getPostComments(groupId, postId)
      setComments(postComments)
    } catch (error) {
      console.error("Erro ao carregar comentários:", error)
    } finally {
      setLoadingComments(false)
    }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    return `${day}/${month} às ${hours}:${minutes}`
  }

  const handleAddComment = async () => {
    if (newComment.trim() === "" || !userData) return

    setIsLoading(true)

    try {
      const commentId = await addComment(
        groupId,
        postId,
        userData.uid,
        userData.nome,
        newComment.trim()
      )

      if (commentId) {
        // Adiciona o comentário localmente para feedback imediato
        const newCommentObj: Comment = {
          id: commentId,
          dataCriacao: new Date().toISOString(),
          nomeUsuario: userData.nome,
          texto: newComment.trim(),
          userId: userData.uid,
        }

        setComments([newCommentObj, ...comments])
        setNewComment("")
      }
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderComment = ({ item }: { item: Comment }) => {
    const isCurrentUser = item.userId === userData?.uid

    return (
      <View style={styles.commentCard}>
        <View style={styles.commentHeader}>
          <View style={[styles.commentAvatar, isCurrentUser && styles.currentUserAvatar]}>
            <Text style={styles.commentAvatarText}>
              {item.nomeUsuario.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.commentContent}>
            <View style={styles.commentMeta}>
              <Text style={styles.commentUser}>{item.nomeUsuario}</Text>
              <Text style={styles.commentDate}>{formatDate(item.dataCriacao)}</Text>
            </View>
            <Text style={styles.commentText}>{item.texto}</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      {/* Comments List */}
      <View style={styles.commentsContainer}>
        {loadingComments ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#322D70" />
          </View>
        ) : comments.length > 0 ? (
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.commentSeparator} />}
          />
        ) : (
          <View style={styles.emptyComments}>
            <Text style={styles.emptyCommentsText}>
              Nenhum comentário ainda. Seja o primeiro! 💬
            </Text>
          </View>
        )}
      </View>

      {/* Add Comment Form */}
      <View style={styles.addCommentContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Escreva um comentário..."
            placeholderTextColor="#94A3B8"
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
            editable={!isLoading}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.sendButton,
            (newComment.trim() === "" || isLoading) && styles.sendButtonDisabled,
          ]}
          onPress={handleAddComment}
          disabled={newComment.trim() === "" || isLoading}
        >
          {isLoading ? (
            <Text style={styles.sendButtonText}>...</Text>
          ) : (
            <Icon icon="caretRight" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* Character Count */}
      {newComment.length > 0 && (
        <Text style={styles.characterCount}>
          {newComment.length}/500
        </Text>
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 16,
    alignItems: "center",
  },
  commentsContainer: {
    marginBottom: 12,
  },
  commentCard: {
    paddingVertical: 8,
  },
  commentHeader: {
    flexDirection: "row",
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#94A3B8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  currentUserAvatar: {
    backgroundColor: "#7C3AED",
  },
  commentAvatarText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  commentContent: {
    flex: 1,
  },
  commentMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: "600",
    color: "#322D70",
  },
  commentDate: {
    fontSize: 12,
    color: "#94A3B8",
  },
  commentText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
  },
  commentSeparator: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 8,
  },
  emptyComments: {
    paddingVertical: 16,
    alignItems: "center",
  },
  emptyCommentsText: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
  },
  addCommentContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
    maxHeight: 100,
  },
  input: {
    fontSize: 14,
    color: "#322D70",
    padding: 0,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#322D70",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#CBD5E1",
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  characterCount: {
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "right",
    marginTop: 4,
  },
})
