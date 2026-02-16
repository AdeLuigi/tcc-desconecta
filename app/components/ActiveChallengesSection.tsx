import React, { useState, useEffect } from "react"
import { View, StyleSheet, TouchableOpacity, ScrollView, Image, Modal, ActivityIndicator, Alert } from "react-native"
import { Text } from "@/components/Text"
import ProgressBar from "@/components/ProgressBar"
import { Icon } from "@/components/Icon"
import { getUserActiveChallenges, UserActiveChallenge, leaveChallenge } from "@/services/challengeService"

interface ActiveChallengesSectionProps {
  userId: string | undefined
  onChallengeUpdate?: () => void // Callback opcional para atualizar outras listas
  showTitle?: boolean // Se deve mostrar o título da seção
  horizontal?: boolean // Se deve exibir em scroll horizontal
  refreshKey?: number // Key para forçar atualização externa
}

export const ActiveChallengesSection: React.FC<ActiveChallengesSectionProps> = ({
  userId,
  onChallengeUpdate,
  showTitle = true,
  horizontal = true,
  refreshKey = 0,
}) => {
  const [activeChallenges, setActiveChallenges] = useState<UserActiveChallenge[]>([])
  const [isLoadingActiveChallenges, setIsLoadingActiveChallenges] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [confirmExitModalVisible, setConfirmExitModalVisible] = useState(false)
  const [selectedChallenge, setSelectedChallenge] = useState<UserActiveChallenge | null>(null)

  // Buscar desafios ativos do usuário
  const fetchUserActiveChallenges = async () => {
    if (!userId) {
      setIsLoadingActiveChallenges(false)
      return
    }
    
    try {
      setIsLoadingActiveChallenges(true)
      const challenges = await getUserActiveChallenges(userId)
      setActiveChallenges(challenges)
    } catch (error) {
      console.error("Erro ao buscar desafios ativos:", error)
      Alert.alert("Erro", "Não foi possível carregar seus desafios ativos")
    } finally {
      setIsLoadingActiveChallenges(false)
    }
  }

  // Buscar desafios ativos quando userId estiver disponível ou refreshKey mudar
  useEffect(() => {
    if (userId) {
      fetchUserActiveChallenges()
    }
  }, [userId, refreshKey])

  const handleOpenModal = (challenge: UserActiveChallenge) => {
    setSelectedChallenge(challenge)
    setModalVisible(true)
  }

  const handleCloseModal = () => {
    setModalVisible(false)
    setSelectedChallenge(null)
  }

  const handleOpenConfirmExitModal = () => {
    setConfirmExitModalVisible(true)
  }

  const handleCloseConfirmExitModal = () => {
    setConfirmExitModalVisible(false)
  }

  const handleConfirmExit = async () => {
    if (!userId || !selectedChallenge?.id) {
      return
    }

    try {
      await leaveChallenge(userId, selectedChallenge.id)
      Alert.alert("Sucesso", "Você saiu do desafio")
      
      // Atualizar lista de desafios ativos
      await fetchUserActiveChallenges()
      
      // Notificar componente pai se houver callback
      if (onChallengeUpdate) {
        onChallengeUpdate()
      }
      
      setConfirmExitModalVisible(false)
      setModalVisible(false)
      setSelectedChallenge(null)
    } catch (error) {
      console.error("Erro ao sair do desafio:", error)
      Alert.alert("Erro", "Não foi possível sair do desafio. Tente novamente.")
    }
  }

  const renderChallengeCard = (challenge: UserActiveChallenge) => (
    <TouchableOpacity 
      key={challenge.id} 
      style={styles.challengeCard}
      onPress={() => handleOpenModal(challenge)}
    >
      <View style={styles.challengeIcon}>
        <Image source={{ uri: challenge.imagem }} style={styles.badgeImage} />
      </View>
      <ProgressBar progress={challenge.progresso || 0} />
      <Text style={styles.challengeTitle}>{challenge.nome}</Text>
    </TouchableOpacity>
  )

  if (isLoadingActiveChallenges) {
    return (
      <View style={styles.section}>
        {showTitle && <Text style={styles.sectionTitle}>Desafios ativos</Text>}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#72C3E0" />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </View>
    )
  }

  if (activeChallenges.length === 0) {
    return (
      <View style={styles.section}>
        {showTitle && <Text style={styles.sectionTitle}>Desafios ativos</Text>}
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Você não está participando de nenhum desafio</Text>
        </View>
      </View>
    )
  }

  return (
    <>
      <View style={styles.section}>
        {showTitle && <Text style={styles.sectionTitle}>Desafios ativos</Text>}
        {horizontal ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {activeChallenges.map((challenge) => renderChallengeCard(challenge))}
          </ScrollView>
        ) : (
          <View style={styles.verticalContainer}>
            {activeChallenges.map((challenge) => renderChallengeCard(challenge))}
          </View>
        )}
      </View>

      {/* Modal Challenge Details */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.challengeModalContent}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleCloseModal}
            >
              <Icon icon="x" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {selectedChallenge && (
              <>
                <View style={styles.modalBadgeContainer}>
                  <Image 
                    source={{ uri: selectedChallenge.imagem }} 
                    style={styles.modalBadgeImage} 
                  />
                </View>

                <Text style={styles.modalChallengeTitle}>
                  {selectedChallenge.nome}
                </Text>
                
                <Text style={styles.modalChallengeDescription}>
                  {selectedChallenge.descricao}
                </Text>

                <View style={styles.modalProgressContainer}>
                  <ProgressBar progress={selectedChallenge.progresso || 0} />
                  <Text style={styles.modalProgressText}>{selectedChallenge.progresso || 0}%</Text>
                </View>

                <TouchableOpacity 
                  style={styles.exitChallengeButton}
                  onPress={handleOpenConfirmExitModal}
                >
                  <Text style={styles.exitChallengeButtonText}>sair do desafio</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal Confirm Exit Challenge */}
      <Modal
        visible={confirmExitModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCloseConfirmExitModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmExitModalContent}>
            <Text style={styles.confirmExitTitle}>Sair do desafio?</Text>
            
            <Text style={styles.confirmExitDescription}>
              Tem certeza que quer sair do desafio "{selectedChallenge?.nome}" e perder todo o seu progresso conquistado até aqui?
            </Text>

            <View style={styles.confirmExitButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCloseConfirmExitModal}
              >
                <Text style={styles.cancelButtonText}>cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.exitButton}
                onPress={handleConfirmExit}
              >
                <Text style={styles.exitButtonText}>sair do desafio</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#322D70",
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: "#94A3B8",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
  },
  horizontalScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  verticalContainer: {
    gap: 12,
  },
  challengeCard: {
    backgroundColor: "#1E1B4B",
    borderRadius: 16,
    padding: 16,
    width: 140,
    marginRight: 12,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  challengeIcon: {
    width: 60,
    height: 60,
    backgroundColor: "#312E81",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    overflow: "hidden",
  },
  badgeImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  challengeTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
    lineHeight: 18,
    textAlign: "center",
    marginTop: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  challengeModalContent: {
    backgroundColor: "#1E1B4B",
    borderRadius: 24,
    padding: 32,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBadgeContainer: {
    width: 120,
    height: 120,
    borderRadius: 24,
    backgroundColor: "#312E81",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    overflow: "hidden",
  },
  modalBadgeImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  modalChallengeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
  },
  modalChallengeDescription: {
    fontSize: 16,
    color: "#C7D2FE",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  modalProgressContainer: {
    width: "100%",
    marginBottom: 24,
  },
  modalProgressText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 8,
  },
  exitChallengeButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  exitChallengeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Confirm Exit Modal
  confirmExitModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  confirmExitTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#322D70",
    textAlign: "center",
    marginBottom: 16,
  },
  confirmExitDescription: {
    fontSize: 16,
    color: "#6881BA",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  confirmExitButtons: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#E5E7EB",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  exitButton: {
    flex: 1,
    backgroundColor: "#EF4444",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  exitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
})
