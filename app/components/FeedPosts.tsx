import React, { useState, useEffect } from "react"
import { View, StyleSheet, Image, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView } from "react-native"
import { Text } from "./Text"
import { PostComments } from "@/components/PostComments"
import { getGroupFeed, type FeedPost, type TipoAtividade } from "@/services/feedService"
import { useNavigation } from "@react-navigation/native"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"

export type { FeedPost, TipoAtividade }

interface FeedPostsProps {
  groupId: string
}

const ACTIVITY_TYPES: Record<TipoAtividade, { label: string; emoji: string; color: string }> = {
  desafio_completo: { label: "Desafio Completo", emoji: "🏆", color: "#7C3AED" },
  atividade_alternativa: { label: "Atividade Alternativa", emoji: "🎯", color: "#10B981" },
  meta_atingida: { label: "Meta Atingida", emoji: "⭐", color: "#F59E0B" },
  progresso: { label: "Progresso", emoji: "📈", color: "#3B82F6" },
  leitura: { label: "Leitura", emoji: "📚", color: "#8B5CF6" },
}

const formatDateLabel = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).replace(/^./, (c) => c.toUpperCase())
}

const formatTime = (dateString: string): string => {
  const date = new Date(dateString)
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  return `${hours}:${minutes}`
}

const getDateKey = (dateString: string): string => {
  return new Date(dateString).toISOString().split("T")[0]
}

const groupPostsByDate = (posts: FeedPost[]): { dateKey: string; label: string; posts: FeedPost[] }[] => {
  const map = new Map<string, FeedPost[]>()
  for (const post of posts) {
    const key = getDateKey(post.dataCriacao)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(post)
  }
  return Array.from(map.entries()).map(([dateKey, datePosts]) => ({
    dateKey,
    label: formatDateLabel(datePosts[0].dataCriacao),
    posts: datePosts,
  }))
}

export const FeedPosts: React.FC<FeedPostsProps> = ({ groupId }) => {
  const navigation = useNavigation<AppStackScreenProps<"DetalhesDoGrupo">["navigation"]>()
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null)
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadFeed()
  }, [groupId])

  const loadFeed = async () => {
    try {
      setLoading(true)
      const feedPosts = await getGroupFeed(groupId)
      setPosts(feedPosts)
    } catch (error) {
      console.error("Erro ao carregar feed:", error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadFeed()
    setRefreshing(false)
  }

  const toggleComments = (postId: string) => {
    setExpandedPostId(expandedPostId === postId ? null : postId)
  }

  const renderPost = (item: FeedPost) => {
    const activityInfo = ACTIVITY_TYPES[item.tipoAtividade] || ACTIVITY_TYPES.progresso
    const isExpanded = expandedPostId === item.id

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.postCard}
        onPress={() => toggleComments(item.id)}
        activeOpacity={0.85}
      >
        {/* Thumbnail */}
        <View style={styles.thumbnail}>
          {item.foto ? (
            <Image source={{ uri: item.foto }} style={styles.thumbnailImage} resizeMode="cover" />
          ) : (
            <View style={[styles.thumbnailPlaceholder, { backgroundColor: activityInfo.color + "22" }]}>
              <Text style={styles.thumbnailEmoji}>{activityInfo.emoji}</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.postContent}>
          <Text style={styles.postTitle} numberOfLines={2}>{item.descricao}</Text>
          <View style={styles.postMeta}>
            {/* Avatar + name */}
            <TouchableOpacity
              style={styles.postAuthor}
              onPress={() => navigation.navigate("DetalhesDoUsuario", { userId: item.userId })}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={styles.metaAvatar}>
                {item.photoURL ? (
                  <Image source={{ uri: item.photoURL }} style={styles.metaAvatarImage} resizeMode="cover" />
                ) : (
                  <Text style={styles.metaAvatarText}>{item.nome.charAt(0).toUpperCase()}</Text>
                )}
              </View>
              <Text style={styles.postAuthorName} numberOfLines={1}>{item.nome}</Text>
            </TouchableOpacity>
            {/* Time */}
            <Text style={styles.postTime}>{formatTime(item.dataCriacao)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#322D70" />
        <Text style={styles.loadingText}>Carregando feed...</Text>
      </View>
    )
  }

  const grouped = groupPostsByDate(posts)

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#322D70" colors={["#322D70"]} />
      }
      showsVerticalScrollIndicator={false}
    >
      {grouped.length > 0 ? (
        grouped.map((group) => (
          <View key={group.dateKey}>
            {/* Date separator */}
            <View style={styles.dateSeparator}>
              <Text style={styles.dateSeparatorText}>{group.label}</Text>
            </View>
            {group.posts.map((post) => renderPost(post))}
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Nenhuma atividade publicada ainda</Text>
          <Text style={styles.emptyStateSubtext}>Seja o primeiro a compartilhar seu progresso!</Text>
        </View>
      )}
      <View style={{ height: 16 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#94A3B8",
  },
  dateSeparator: {
    alignSelf: "center",
    backgroundColor: "#E8EAF6",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  dateSeparatorText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#322D70",
  },
  postCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  thumbnail: {
    width: 80,
    height: 80,
  },
  thumbnailImage: {
    width: 80,
    height: 80,
  },
  thumbnailPlaceholder: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnailEmoji: {
    fontSize: 32,
  },
  postContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "space-between",
  },
  postTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    lineHeight: 20,
    marginBottom: 8,
  },
  postMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  postAuthor: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  metaAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#6881BA",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginRight: 6,
  },
  metaAvatarImage: {
    width: 22,
    height: 22,
  },
  metaAvatarText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  postAuthorName: {
    fontSize: 12,
    color: "#6881BA",
    fontWeight: "bold",
    flex: 1,
  },
  postTime: {
    fontSize: 12,
    color: "#6881BA",
    fontWeight: "bold",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
  },
})

