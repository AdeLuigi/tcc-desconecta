import React, { useState } from "react"
import { View, StyleSheet, ScrollView, Image, TouchableOpacity } from "react-native"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Icon } from "@/components/Icon"
import { FeedPosts } from "@/components/FeedPosts"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"

interface DetalhesDoGrupoScreenProps extends AppStackScreenProps<"DetalhesDoGrupo"> {}

export const DetalhesDoGrupoScreen: React.FC<DetalhesDoGrupoScreenProps> = ({ navigation, route }) => {
  const { theme } = useAppTheme()
  const { grupo } = route.params
  const [activeTab, setActiveTab] = useState<"info" | "feed">("info")

  // Ordenar ranking por pontos
  const rankingOrdenado = [...grupo.ranking_mensal].sort((a, b) => b.pontos - a.pontos)

  // Calcular estatísticas do grupo
  const totalPontos = grupo.ranking_mensal.reduce((sum, item) => sum + item.pontos, 0)
  const mediaPontos = Math.round(totalPontos / grupo.ranking_mensal.length)

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon icon="back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Grupo</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "info" && styles.tabActive]}
            onPress={() => setActiveTab("info")}
          >
            <Text style={[styles.tabText, activeTab === "info" && styles.tabTextActive]}>
              Informações
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "feed" && styles.tabActive]}
            onPress={() => setActiveTab("feed")}
          >
            <Text style={[styles.tabText, activeTab === "feed" && styles.tabTextActive]}>
              Feed do Grupo
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "info" ? (
          <>
            {/* Group Info Card */}
        <View style={styles.groupInfoCard}>
          <View style={styles.groupHeader}>
            <View style={styles.groupAvatarLarge}>
              {typeof grupo.foto === 'string' ? (
                <Image source={{ uri: grupo.foto }} style={styles.groupImage} />
              ) : (
                <Image source={grupo.foto} style={styles.groupImage} />
              )}
            </View>
            <View style={styles.groupHeaderInfo}>
              <Text style={styles.groupName}>{grupo.nome}</Text>
              <Text style={styles.groupMembers}>👥 {grupo.membros.length} membros</Text>
            </View>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.sectionLabel}>Descrição</Text>
            <Text style={styles.groupDescription}>{grupo.descricao}</Text>
          </View>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Estatísticas do Grupo</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalPontos.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Pontos Totais</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{mediaPontos}</Text>
              <Text style={styles.statLabel}>Média de Pontos</Text>
            </View>
          </View>
        </View>

        {/* Members Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Membros ({grupo.membros.length})</Text>
          {grupo.membros.map((membro, index) => {
            const isAdmin = membro.cargo === "administrador"
            return (
              <View key={index} style={styles.memberCard}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {membro.userId.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <View style={styles.memberNameRow}>
                    <Text style={styles.memberName}>{membro.userId}</Text>
                    {isAdmin && (
                      <View style={styles.adminBadge}>
                        <Text style={styles.adminBadgeText}>Admin</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.memberRole}>
                    {isAdmin ? "Administrador" : "Membro"}
                  </Text>
                </View>
              </View>
            )
          })}
        </View>

        {/* Ranking Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ranking Mensal 🏆</Text>
          {rankingOrdenado.map((item, index) => {
            const posicao = index + 1
            const medalha = posicao === 1 ? "🥇" : posicao === 2 ? "🥈" : posicao === 3 ? "🥉" : ""
            
            return (
              <View key={index} style={styles.rankingCard}>
                <View style={styles.rankingPosition}>
                  {medalha ? (
                    <Text style={styles.medalEmoji}>{medalha}</Text>
                  ) : (
                    <Text style={styles.positionNumber}>{posicao}º</Text>
                  )}
                </View>
                <View style={styles.rankingAvatar}>
                  <Text style={styles.rankingAvatarText}>
                    {item.userId.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.rankingInfo}>
                  <Text style={styles.rankingName}>{item.userId}</Text>
                  <View style={styles.rankingPointsBar}>
                    <View 
                      style={[
                        styles.rankingPointsFill,
                        { width: `${(item.pontos / rankingOrdenado[0].pontos) * 100}%` }
                      ]} 
                    />
                  </View>
                </View>
                <Text style={styles.rankingPoints}>{item.pontos}</Text>
              </View>
            )
          })}
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate("PaginaDoGrupo")}
        >
          <Text style={styles.actionButtonText}>Ver Página do Grupo</Text>
          <Icon icon="chevron" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
          </>
        ) : (
          /* Feed Tab */
          <View style={styles.feedContainer}>
            <FeedPosts groupId={grupo.id} />
          </View>
        )}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#322D70",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  scrollContent: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#322D70",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6881BA",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  feedContainer: {
    flex: 1,
    minHeight: 400,
  },
  groupInfoCard: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  groupAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginRight: 16,
  },
  groupImage: {
    width: "100%",
    height: "100%",
  },
  groupHeaderInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#322D70",
    marginBottom: 8,
  },
  groupMembers: {
    fontSize: 16,
    color: "#6881BA",
  },
  descriptionSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6881BA",
    marginBottom: 8,
  },
  groupDescription: {
    fontSize: 16,
    color: "#475569",
    lineHeight: 24,
  },
  statsCard: {
    backgroundColor: "#322D70",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 16,
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#322D70",
    marginBottom: 12,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#6881BA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#322D70",
    marginRight: 8,
  },
  adminBadge: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  memberRole: {
    fontSize: 14,
    color: "#6881BA",
  },
  rankingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  rankingPosition: {
    width: 40,
    alignItems: "center",
    marginRight: 8,
  },
  medalEmoji: {
    fontSize: 24,
  },
  positionNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6881BA",
  },
  rankingAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rankingAvatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#322D70",
  },
  rankingInfo: {
    flex: 1,
    marginRight: 12,
  },
  rankingName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#322D70",
    marginBottom: 6,
  },
  rankingPointsBar: {
    height: 6,
    backgroundColor: "#E0E7FF",
    borderRadius: 3,
    overflow: "hidden",
  },
  rankingPointsFill: {
    height: "100%",
    backgroundColor: "#7C3AED",
    borderRadius: 3,
  },
  rankingPoints: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#322D70",
    minWidth: 60,
    textAlign: "right",
  },
  actionButton: {
    flexDirection: "row",
    backgroundColor: "#322D70",
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginRight: 8,
  },
})
