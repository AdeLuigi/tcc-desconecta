import React, { useState } from "react"
import { View, StyleSheet, Image, TouchableOpacity } from "react-native"
import { Text } from "./Text"
import { Icon } from "./Icon"
import { PostComments } from "@/components/PostComments"

export type TipoAtividade = 'desafio_completo' | 'atividade_alternativa' | 'meta_atingida' | 'progresso'

export interface FeedPost {
  id: string
  dataCriacao: Date
  descricao: string
  foto?: string
  tipoAtividade: TipoAtividade
  userId: string
  nomeUsuario: string
}

interface FeedPostsProps {
  groupId: string
}

// Mock data
const MOCK_POSTS: FeedPost[] = [
  {
    id: "post1",
    dataCriacao: new Date("2026-01-31T14:30:00"),
    descricao: "Consegui ficar 24 horas sem redes sociais! 🎉 Foi desafiador mas muito gratificante.",
    foto: "https://picsum.photos/400/300?random=1",
    tipoAtividade: "desafio_completo",
    userId: "felipe123",
    nomeUsuario: "Felipe",
  },
  {
    id: "post2",
    dataCriacao: new Date("2026-01-31T10:15:00"),
    descricao: "Hoje li um livro inteiro em vez de ficar no celular. Recomendo 'Foco' de Daniel Goleman!",
    foto: "https://picsum.photos/400/300?random=2",
    tipoAtividade: "atividade_alternativa",
    userId: "ana",
    nomeUsuario: "Ana",
  },
  {
    id: "post3",
    dataCriacao: new Date("2026-01-30T18:45:00"),
    descricao: "Passei apenas 2 horas no celular hoje! Meu recorde pessoal 💪",
    tipoAtividade: "meta_atingida",
    userId: "pedro",
    nomeUsuario: "Pedro",
  },
  {
    id: "post4",
    dataCriacao: new Date("2026-01-30T12:20:00"),
    descricao: "Comecei a meditar pela manhã em vez de checar o Instagram. Que diferença!",
    foto: "https://picsum.photos/400/300?random=3",
    tipoAtividade: "atividade_alternativa",
    userId: "carla",
    nomeUsuario: "Carla",
  },
]

const ACTIVITY_TYPES: Record<TipoAtividade, { label: string; emoji: string; color: string }> = {
  desafio_completo: { label: "Desafio Completo", emoji: "🏆", color: "#7C3AED" },
  atividade_alternativa: { label: "Atividade Alternativa", emoji: "🎯", color: "#10B981" },
  meta_atingida: { label: "Meta Atingida", emoji: "⭐", color: "#F59E0B" },
  progresso: { label: "Progresso", emoji: "📈", color: "#3B82F6" },
}

export const FeedPosts: React.FC<FeedPostsProps> = ({ groupId }) => {
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null)

  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    return `${day}/${month} às ${hours}:${minutes}`
  }

  const toggleComments = (postId: string) => {
    setExpandedPostId(expandedPostId === postId ? null : postId)
  }

  const renderPost = ({ item }: { item: FeedPost }) => {
    const activityInfo = ACTIVITY_TYPES[item.tipoAtividade] || ACTIVITY_TYPES.progresso
    const isExpanded = expandedPostId === item.id

    return (
      <View style={styles.postCard}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {item.nomeUsuario.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.postHeaderInfo}>
            <Text style={styles.userName}>{item.nomeUsuario}</Text>
            <Text style={styles.postDate}>{formatDate(item.dataCriacao)}</Text>
          </View>
          <View style={[styles.activityBadge, { backgroundColor: activityInfo.color }]}>
            <Text style={styles.activityEmoji}>{activityInfo.emoji}</Text>
          </View>
        </View>

        {/* Post Description */}
        <Text style={styles.postDescription}>{item.descricao}</Text>

        {/* Post Image */}
        {item.foto && (
          <View style={styles.postImageContainer}>
            <Image
              source={{ uri: item.foto }}
              style={styles.postImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Activity Type Label */}
        <View style={styles.activityLabelContainer}>
          <Text style={[styles.activityLabel, { color: activityInfo.color }]}>
            {activityInfo.emoji} {activityInfo.label}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.postActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Icon icon="heart" size={20} color="#6881BA" />
            <Text style={styles.actionText}>Curtir</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => toggleComments(item.id)}
          >
            <Icon icon="view" size={20} color="#6881BA" />
            <Text style={styles.actionText}>
              {isExpanded ? "Ocultar" : "Ver"} Comentários
            </Text>
          </TouchableOpacity>
        </View>

        {/* Comments Section */}
        {isExpanded && (
          <View style={styles.commentsSection}>
            <PostComments groupId={groupId} postId={item.id} />
          </View>
        )}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {MOCK_POSTS.length > 0 ? (
        MOCK_POSTS.map((post) => (
          <View key={post.id}>
            {renderPost({ item: post })}
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Nenhuma atividade publicada ainda
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Seja o primeiro a compartilhar seu progresso!
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  postCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#6881BA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  postHeaderInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#322D70",
    marginBottom: 2,
  },
  postDate: {
    fontSize: 13,
    color: "#94A3B8",
  },
  activityBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  activityEmoji: {
    fontSize: 18,
  },
  postDescription: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 22,
    marginBottom: 12,
  },
  postImageContainer: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 12,
  },
  postImage: {
    width: "100%",
    height: "100%",
  },
  activityLabelContainer: {
    marginBottom: 12,
  },
  activityLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  postActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
    gap: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: "#6881BA",
    fontWeight: "500",
  },
  commentsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
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
