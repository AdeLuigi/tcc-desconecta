import React, { useState, useEffect, useRef } from "react"
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Icon } from "@/components/Icon"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAuth } from "@/context/AuthContext"
import {
  getPostComments,
  addComment,
  toggleReaction,
  getFirestorePost,
  type Comment,
  type TipoAtividade,
} from "@/services/feedService"

interface DetalhesDaPostagemScreenProps extends AppStackScreenProps<"DetalhesDaPostagem"> {}

const ACTIVITY_TYPES: Record<TipoAtividade, { label: string; emoji: string; color: string }> = {
  desafio_completo: { label: "Desafio Completo", emoji: "🏆", color: "#7C3AED" },
  atividade_alternativa: { label: "Atividade Alternativa", emoji: "🎯", color: "#10B981" },
  meta_atingida: { label: "Meta Atingida", emoji: "⭐", color: "#F59E0B" },
  progresso: { label: "Progresso", emoji: "📈", color: "#3B82F6" },
  leitura: { label: "Leitura", emoji: "📚", color: "#8B5CF6" },
}

const REACTIONS = ["❤️", "🎯", "🏆", "😊"]

const formatPostDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  const dateKey = date.toISOString().split("T")[0]
  const todayKey = now.toISOString().split("T")[0]
  const yestKey = yesterday.toISOString().split("T")[0]

  const timeStr = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`

  if (dateKey === todayKey) return `Hoje | ${timeStr}`
  if (dateKey === yestKey) return `Ontem | ${timeStr}`
  return `${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} | ${timeStr}`
}

const formatCommentDate = (dateString: string): string => {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  return `${day}/${month} às ${hours}:${minutes}`
}

export const DetalhesDaPostagemScreen: React.FC<DetalhesDaPostagemScreenProps> = ({
  navigation,
  route,
}) => {
  const { post: initialPost, groupId, groupName } = route.params
  const { userData } = useAuth()
  const inputRef = useRef<TextInput>(null)

  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [reactions, setReactions] = useState<Record<string, string[]>>(
    initialPost.reactions || {},
  )
  const [togglingReaction, setTogglingReaction] = useState<string | null>(null)

  useEffect(() => {
    loadComments()
    refreshReactions()
  }, [])

  const loadComments = async () => {
    try {
      setLoadingComments(true)
      const c = await getPostComments(groupId, initialPost.id)
      setComments(c)
    } catch (e) {
      console.error("Erro ao carregar comentários:", e)
    } finally {
      setLoadingComments(false)
    }
  }

  const refreshReactions = async () => {
    try {
      const fresh = await getFirestorePost(groupId, initialPost.id)
      if (fresh) setReactions(fresh.reactions || {})
    } catch (e) {
      console.error("Erro ao atualizar reações:", e)
    }
  }

  const handleToggleReaction = async (emoji: string) => {
    if (!userData) return
    setTogglingReaction(emoji)

    const userReacted = (reactions[emoji] || []).includes(userData.uid)
    // Optimistic update
    setReactions((prev) => {
      const current = prev[emoji] || []
      if (userReacted) {
        const updated = current.filter((id) => id !== userData.uid)
        if (updated.length === 0) {
          const next = { ...prev }
          delete next[emoji]
          return next
        }
        return { ...prev, [emoji]: updated }
      }
      return { ...prev, [emoji]: [...current, userData.uid] }
    })

    try {
      await toggleReaction(groupId, initialPost.id, userData.uid, emoji)
    } catch (e) {
      console.error("Erro ao reagir:", e)
      // Revert optimistic update
      await refreshReactions()
    } finally {
      setTogglingReaction(null)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !userData) return
    setSubmitting(true)
    try {
      const commentId = await addComment(
        groupId,
        initialPost.id,
        userData.uid,
        userData.nome,
        newComment.trim(),
        userData.photoURL,
      )
      if (commentId) {
        const newCommentObj: Comment = {
          id: commentId,
          dataCriacao: new Date().toISOString(),
          nomeUsuario: userData.nome,
          texto: newComment.trim(),
          userId: userData.uid,
          photoURL: userData.photoURL,
        }
        setComments((prev) => [newCommentObj, ...prev])
        setNewComment("")
      }
    } catch (e) {
      console.error("Erro ao comentar:", e)
    } finally {
      setSubmitting(false)
    }
  }

  const activityInfo =
    ACTIVITY_TYPES[initialPost.tipoAtividade as TipoAtividade] || ACTIVITY_TYPES.progresso

  const renderComment = ({ item }: { item: Comment }) => {
    const isCurrentUser = item.userId === userData?.uid
    return (
      <View style={styles.commentCard}>
        <TouchableOpacity
          style={styles.commentInner}
          onPress={() => navigation.navigate("DetalhesDoUsuario", { userId: item.userId })}
          activeOpacity={0.7}
        >
          <View style={[styles.commentAvatar, isCurrentUser && styles.currentUserAvatar]}>
            {item.photoURL ? (
              <Image
                source={{ uri: item.photoURL }}
                style={styles.commentAvatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.commentAvatarText}>
                {item.nomeUsuario.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.commentContent}>
            <View style={styles.commentMeta}>
              <Text style={styles.commentUser}>{item.nomeUsuario}</Text>
              <Text style={styles.commentDate}>{formatCommentDate(item.dataCriacao)}</Text>
            </View>
            <Text style={styles.commentText}>{item.texto}</Text>
          </View>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon icon="caretLeft" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {groupName || initialPost.nome}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={renderComment}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View>
              {/* Post Image */}
              {initialPost.foto ? (
                <Image
                  source={{ uri: initialPost.foto }}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.postImagePlaceholder,
                    { backgroundColor: activityInfo.color + "22" },
                  ]}
                >
                  <Text style={styles.placeholderEmoji}>{activityInfo.emoji}</Text>
                </View>
              )}

              {/* Post body */}
              <View style={styles.postBody}>
                {/* Author row */}
                <TouchableOpacity
                  style={styles.authorRow}
                  onPress={() =>
                    navigation.navigate("DetalhesDoUsuario", { userId: initialPost.userId })
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.authorAvatarWrapper}>
                    {initialPost.photoURL ? (
                      <Image
                        source={{ uri: initialPost.photoURL }}
                        style={styles.authorAvatar}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.authorAvatarPlaceholder}>
                        <Text style={styles.authorAvatarText}>
                          {initialPost.nome.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.authorInfo}>
                    <Text style={styles.authorName}>{initialPost.nome}</Text>
                    <Text style={styles.postDate}>{formatPostDate(initialPost.dataCriacao)}</Text>
                  </View>
                  <View
                    style={[
                      styles.activityBadge,
                      { backgroundColor: activityInfo.color + "22" },
                    ]}
                  >
                    <Text style={[styles.activityBadgeText, { color: activityInfo.color }]}>
                      {activityInfo.emoji} {activityInfo.label}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Description */}
                <Text style={styles.postDescription}>{initialPost.descricao}</Text>

                {/* Reactions */}
                <View style={styles.reactionsRow}>
                  {REACTIONS.map((emoji) => {
                    const users = reactions[emoji] || []
                    const reacted = userData ? users.includes(userData.uid) : false
                    return (
                      <TouchableOpacity
                        key={emoji}
                        style={[styles.reactionButton, reacted && styles.reactionButtonActive]}
                        onPress={() => handleToggleReaction(emoji)}
                        disabled={togglingReaction !== null}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.reactionEmoji}>{emoji}</Text>
                        {users.length > 0 && (
                          <Text
                            style={[
                              styles.reactionCount,
                              reacted && styles.reactionCountActive,
                            ]}
                          >
                            {users.length}
                          </Text>
                        )}
                      </TouchableOpacity>
                    )
                  })}
                </View>

                {/* Comments header */}
                <View style={styles.commentsHeader}>
                  <Text style={styles.commentsTitle}>
                    Comentários{" "}
                    {!loadingComments && (
                      <Text style={styles.commentsTitleCount}>({comments.length})</Text>
                    )}
                  </Text>
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            loadingComments ? (
              <View style={styles.loadingComments}>
                <ActivityIndicator size="small" color="#322D70" />
              </View>
            ) : (
              <View style={styles.emptyComments}>
                <Text style={styles.emptyCommentsText}>
                  Nenhum comentário ainda. Seja o primeiro!
                </Text>
              </View>
            )
          }
        />

        {/* Comment input */}
        <View style={styles.commentInputRow}>
          {userData?.photoURL ? (
            <Image
              source={{ uri: userData.photoURL }}
              style={styles.inputAvatar}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.inputAvatarPlaceholder}>
              <Text style={styles.inputAvatarText}>
                {userData?.nome?.charAt(0).toUpperCase() ?? "?"}
              </Text>
            </View>
          )}
          <TextInput
            ref={inputRef}
            style={styles.commentInput}
            placeholder="Escreva um comentário"
            placeholderTextColor="#94A3B8"
            value={newComment}
            onChangeText={setNewComment}
            editable={!submitting}
            returnKeyType="send"
            onSubmitEditing={handleAddComment}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newComment.trim() || submitting) && styles.sendButtonDisabled,
            ]}
            onPress={handleAddComment}
            disabled={!newComment.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.sendButtonText}>enviar</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#322D70",
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  headerRight: {
    width: 36,
  },
  listContent: {
    paddingBottom: 8,
  },
  postImage: {
    width: "100%",
    height: 260,
  },
  postImagePlaceholder: {
    width: "100%",
    height: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderEmoji: {
    fontSize: 64,
  },
  postBody: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    marginBottom: 8,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  authorAvatarWrapper: {
    marginRight: 12,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  authorAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
  },
  authorAvatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#322D70",
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#322D70",
  },
  postDate: {
    fontSize: 13,
    color: "#6881BA",
    marginTop: 2,
  },
  activityBadge: {
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  activityBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  postDescription: {
    fontSize: 15,
    color: "#1E293B",
    lineHeight: 22,
    marginBottom: 16,
  },
  reactionsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  reactionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
    gap: 4,
  },
  reactionButtonActive: {
    backgroundColor: "#E0E7FF",
    borderColor: "#322D70",
  },
  reactionEmoji: {
    fontSize: 20,
  },
  reactionCount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6881BA",
  },
  reactionCountActive: {
    color: "#322D70",
  },
  commentsHeader: {
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#322D70",
  },
  commentsTitleCount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6881BA",
  },
  commentCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 0,
    marginBottom: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  commentInner: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginRight: 12,
  },
  currentUserAvatar: {
    backgroundColor: "#C7D2FE",
  },
  commentAvatarImage: {
    width: 36,
    height: 36,
  },
  commentAvatarText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#322D70",
  },
  commentContent: {
    flex: 1,
  },
  commentMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#322D70",
  },
  commentDate: {
    fontSize: 12,
    color: "#94A3B8",
  },
  commentText: {
    fontSize: 14,
    color: "#1E293B",
    lineHeight: 20,
  },
  loadingComments: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyComments: {
    paddingVertical: 24,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  emptyCommentsText: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 8,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  inputAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
  },
  inputAvatarText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#322D70",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: "#1E293B",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    maxHeight: 80,
  },
  sendButton: {
    backgroundColor: "#322D70",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 60,
  },
  sendButtonDisabled: {
    backgroundColor: "#94A3B8",
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
})
