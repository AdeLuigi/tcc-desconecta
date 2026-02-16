import React, { useState, useEffect } from "react"
import { View, StyleSheet, TouchableOpacity, ScrollView, Image, ImageBackground, Modal, TextInput, Alert, ActivityIndicator } from "react-native"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import ProgressBar from "@/components/ProgressBar"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import { Icon } from "@/components/Icon"
import { useAuth } from "@/context/AuthContext"
import { createChallenge, uploadChallengeImage, Challenge } from "@/services/challengeService"
import { Timestamp, getFirestore, collection, getDocs, query, where } from "@react-native-firebase/firestore"
import * as ImagePicker from 'expo-image-picker'

const Logo = require("@assets/images/logo2.png")
const HeaderBackground = require("@assets/images/9ae8f9136d5d3212c5b60df64ba4f3eec8172563.png")
const BadgeSocialNetwork = require("@assets/images/badge-social-network.png")
const BadgeWeek = require("@assets/images/badge-week.png")

interface DesafiosPublicosScreenProps extends AppStackScreenProps<"DesafiosPublicos"> {}

export const DesafiosPublicosScreen: React.FC<DesafiosPublicosScreenProps> = ({ navigation }) => {
  const { theme } = useAppTheme()
  const { authEmail } = useAuth()
  const [modalVisible, setModalVisible] = useState(false)
  const [confirmExitModalVisible, setConfirmExitModalVisible] = useState(false)
  const [createChallengeModalVisible, setCreateChallengeModalVisible] = useState(false)
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [availableChallenges, setAvailableChallenges] = useState<Challenge[]>([])
  const [isLoadingChallenges, setIsLoadingChallenges] = useState(true)

  // Form state for new challenge
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    categoria: "",
    duracao: "",
    meta: "",
  })

  const isAdmin = authEmail === "adeluigi@ic.ufrj.br"

  // Buscar desafios disponíveis do Firestore
  const fetchAvailableChallenges = async () => {
    try {
      setIsLoadingChallenges(true)
      const db = getFirestore()
      const challengesRef = collection(db, "desafios")
      
      // Buscar todos os desafios
      const snapshot = await getDocs(challengesRef)
      const now = Timestamp.now()
      
      const challenges: Challenge[] = []
      snapshot.forEach((doc: any) => {
        const data = doc.data()
        // Filtrar apenas desafios que ainda não expiraram
        if (data.dataFinal && data.dataFinal.toMillis() > now.toMillis()) {
          challenges.push({
            id: doc.id,
            nome: data.nome,
            descricao: data.descricao,
            categoria: data.categoria,
            duracao: data.duracao,
            meta: data.meta,
            imagem: data.imagem,
            dataInicio: data.dataInicio,
            dataFinal: data.dataFinal,
          })
        }
      })
      
      setAvailableChallenges(challenges)
    } catch (error) {
      console.error("Erro ao buscar desafios:", error)
      Alert.alert("Erro", "Não foi possível carregar os desafios")
    } finally {
      setIsLoadingChallenges(false)
    }
  }

  // Buscar desafios quando o componente montar
  useEffect(() => {
    fetchAvailableChallenges()
  }, [])

  const activeChallenges = [
    { 
      id: 1, 
      title: "24 horas sem redes sociais", 
      progress: 20, 
      imageLogo: BadgeSocialNetwork,
      description: "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias"
    },
    { 
      id: 2, 
      title: "7 dias com menos de 3 horas", 
      progress: 20, 
      imageLogo: BadgeWeek,
      description: "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias"
    },
    { 
      id: 3, 
      title: "7 dias com menos de 3 horas diárias", 
      progress: 20, 
      imageLogo: BadgeWeek,
      description: "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias"
    },
  ]

  const handleOpenModal = (challenge: any) => {
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

  const handleConfirmExit = () => {
    // Aqui você pode adicionar lógica para remover o usuário do desafio
    setConfirmExitModalVisible(false)
    setModalVisible(false)
    setSelectedChallenge(null)
  }

  const handleOpenCreateChallengeModal = () => {
    setCreateChallengeModalVisible(true)
  }

  const handleCloseCreateChallengeModal = () => {
    setCreateChallengeModalVisible(false)
    setFormData({
      nome: "",
      descricao: "",
      categoria: "",
      duracao: "",
      meta: "",
    })
    setSelectedImage(null)
  }

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
      
      if (!permissionResult.granted) {
        Alert.alert("Permissão negada", "Você precisa permitir o acesso à galeria")
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error("Erro ao selecionar imagem:", error)
      Alert.alert("Erro", "Não foi possível selecionar a imagem")
    }
  }

  const handleCreateChallenge = async () => {
    // Validação básica
    if (!formData.nome || !formData.descricao || !formData.categoria || !formData.duracao || !formData.meta) {
      Alert.alert("Erro", "Por favor, preencha todos os campos obrigatórios")
      return
    }

    if (!selectedImage) {
      Alert.alert("Erro", "Por favor, selecione uma imagem para o desafio")
      return
    }

    setIsCreating(true)
    try {
      // Fazer upload da imagem primeiro
      let imageURL = ""
      if (selectedImage) {
        setIsUploadingImage(true)
        imageURL = await uploadChallengeImage(selectedImage)
        setIsUploadingImage(false)
      }

      const now = Timestamp.now()
      const duracao = parseInt(formData.duracao)
      const dataFinal = Timestamp.fromDate(
        new Date(now.toDate().getTime() + duracao * 24 * 60 * 60 * 1000)
      )

      await createChallenge({
        nome: formData.nome,
        descricao: formData.descricao,
        categoria: formData.categoria,
        duracao: duracao,
        meta: parseInt(formData.meta),
        imagem: imageURL,
        dataInicio: now,
        dataFinal: dataFinal,
      })

      Alert.alert("Sucesso", "Desafio criado com sucesso!")
      handleCloseCreateChallengeModal()
      // Recarregar a lista de desafios
      fetchAvailableChallenges()
    } catch (error) {
      console.error("Erro ao criar desafio:", error)
      Alert.alert("Erro", "Não foi possível criar o desafio. Tente novamente.")
    } finally {
      setIsCreating(false)
      setIsUploadingImage(false)
    }
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={styles.container}>
      {/* Header */}
                    {/* Header Banner */}


      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <ImageBackground 
          source={HeaderBackground}
          style={styles.headerBanner}
          resizeMode="cover"
        >
      <View style={styles.header}>
        <Image source={Logo} resizeMode="contain" />
        <TouchableOpacity onPress={() => navigation.navigate("Notificacoes")}>
          <Icon icon="notifications" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>


          <View style={styles.headerBannerOverlay} />
        </ImageBackground>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Title Card */}
          <View style={styles.titleCard}>
            <Icon icon="swords" size={24} color="#322D70" />
            <Text style={styles.pageTitle}>Desafios</Text>
          </View>

          {/* Active Challenges Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Desafios ativos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {activeChallenges.map((challenge) => (
                <TouchableOpacity 
                  key={challenge.id} 
                  style={styles.activeChallengeCard}
                  onPress={() => handleOpenModal(challenge)}
                >
                  <View style={styles.challengeIcon}>
                    <Image source={challenge.imageLogo} style={styles.badgeImage} />
                  </View>
                  <ProgressBar progress={challenge.progress} />
                  <Text style={styles.activeChallengeTitle}>{challenge.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Available Challenges Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Desafios disponíveis</Text>
            {isLoadingChallenges ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#72C3E0" />
                <Text style={styles.loadingText}>Carregando desafios...</Text>
              </View>
            ) : availableChallenges.length > 0 ? (
              <View style={styles.availableChallengesGrid}>
                {availableChallenges.map((challenge) => (
                  <View key={challenge.id} style={styles.availableChallengeCard}>
                    <View style={styles.challengeIconLarge}>
                      <Image source={{ uri: challenge.imagem }} style={styles.badgeImageLarge} />
                    </View>
                    <Text style={styles.availableChallengeTitle}>{challenge.nome}</Text>
                    <TouchableOpacity 
                      style={styles.learnMoreButton}
                      onPress={() => handleOpenModal(challenge)}
                    >
                      <Text style={styles.learnMoreButtonText}>saiba mais</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Nenhum desafio disponível no momento</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

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
                    source={selectedChallenge.imageLogo ? selectedChallenge.imageLogo : { uri: selectedChallenge.imagem }} 
                    style={styles.modalBadgeImage} 
                  />
                </View>

                <Text style={styles.modalChallengeTitle}>
                  {selectedChallenge.title || selectedChallenge.nome}
                </Text>
                
                <Text style={styles.modalChallengeDescription}>
                  {selectedChallenge.description || selectedChallenge.descricao}
                </Text>

                {selectedChallenge.progress !== undefined && (
                  <View style={styles.modalProgressContainer}>
                    <ProgressBar progress={selectedChallenge.progress} />
                    <Text style={styles.modalProgressText}>{selectedChallenge.progress}%</Text>
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.participateButton}
                  onPress={() => {
                    if (selectedChallenge.progress !== undefined) {
                      handleOpenConfirmExitModal()
                    } else {
                      handleCloseModal()
                      // Aqui você pode adicionar lógica para inscrever no desafio
                    }
                  }}
                >
                  <Text style={styles.participateButtonText}>
                    {selectedChallenge.progress !== undefined ? "sair do desafio" : "participar"}
                  </Text>
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
              Tem certeza que quer sair do desafio "{selectedChallenge?.title}" e perder todo o seu progresso conquistado até aqui?
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

      {/* Modal Create Challenge (Admin Only) */}
      <Modal
        visible={createChallengeModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCloseCreateChallengeModal}
      >
        <View style={styles.modalOverlay}>
          <ScrollView 
            contentContainerStyle={styles.createChallengeScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.createChallengeModalContent}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={handleCloseCreateChallengeModal}
              >
                <Icon icon="x" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <Text style={styles.createChallengeTitle}>Criar Novo Desafio</Text>

              <View style={styles.formContainer}>
                <Text style={styles.formLabel}>Nome do Desafio *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.nome}
                  onChangeText={(text) => setFormData({ ...formData, nome: text })}
                  placeholder="Ex: 24 horas sem redes sociais"
                  placeholderTextColor="#999"
                />

                <Text style={styles.formLabel}>Descrição *</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={formData.descricao}
                  onChangeText={(text) => setFormData({ ...formData, descricao: text })}
                  placeholder="Descreva o desafio..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                />

                <Text style={styles.formLabel}>Categoria *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.categoria}
                  onChangeText={(text) => setFormData({ ...formData, categoria: text })}
                  placeholder="Ex: social, produtividade, saúde"
                  placeholderTextColor="#999"
                />

                <Text style={styles.formLabel}>Duração (dias) *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.duracao}
                  onChangeText={(text) => setFormData({ ...formData, duracao: text })}
                  placeholder="Ex: 1, 7, 30"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />

                <Text style={styles.formLabel}>Meta (pontos) *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.meta}
                  onChangeText={(text) => setFormData({ ...formData, meta: text })}
                  placeholder="Ex: 720 (minutos ou pontos)"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />

                <Text style={styles.formLabel}>Imagem do Desafio *</Text>
                <TouchableOpacity 
                  style={styles.imagePickerButton}
                  onPress={pickImage}
                >
                  {selectedImage ? (
                    <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                  ) : (
                    <View style={styles.imagePickerPlaceholder}>
                      <Text style={styles.imagePickerText}>+ Selecionar Imagem</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.createButton, (isCreating || isUploadingImage) && styles.createButtonDisabled]}
                  onPress={handleCreateChallenge}
                  disabled={isCreating || isUploadingImage}
                >
                  <Text style={styles.createButtonText}>
                    {isUploadingImage ? "Enviando imagem..." : isCreating ? "Criando..." : "Criar Desafio"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Floating Action Button (Admin Only) */}
      {isAdmin && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={handleOpenCreateChallengeModal}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
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
  },
  scrollContent: {
    flex: 1,
  },
  headerBanner: {
    width: "100%",
    height: 200,
  },
  headerBannerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(50, 45, 112, 0.2)",
  },
  mainContent: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: -14,
    paddingHorizontal: 16,
  },
  titleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#322D70",
  },
  pageTitleIcon: {
    fontSize: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#322D70",
    marginBottom: 16,
  },
  horizontalScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  availableChallengesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  activeChallengeCard: {
    backgroundColor: "#1E1B4B",
    borderRadius: 16,
    padding: 16,
    width: 150,
    marginRight: 12,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  challengeIcon: {
    width: 80,
    height: 80,
    backgroundColor: "#312E81",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  badgeImage: {
    width: 60,
    height: 60,
    resizeMode: "contain",
  },
  activeChallengeTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
    lineHeight: 18,
    textAlign: "center",
    marginTop: 8,
  },
  availableChallengeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: "48%",
  },
  challengeIconLarge: {
    width: 100,
    height: 100,
    backgroundColor: "#E0E7FF",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  badgeImageLarge: {
    width: 70,
    height: 70,
    resizeMode: "contain",
  },
  availableChallengeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#322D70",
    textAlign: "center",
    marginBottom: 16,
  },
  learnMoreButton: {
    backgroundColor: "#72C3E0",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  learnMoreButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  challengeModalContent: {
    backgroundColor: "#3F3A76",
    borderRadius: 24,
    width: "100%",
    maxWidth: 400,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    backgroundColor: "rgba(139, 152, 199, 0.3)",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    padding: 20,
  },
  modalBadgeImage: {
    width: 80,
    height: 80,
    resizeMode: "contain",
  },
  modalChallengeTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
  },
  modalChallengeDescription: {
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    opacity: 0.9,
  },
  modalProgressContainer: {
    width: "100%",
    marginBottom: 24,
    alignItems: "center",
  },
  modalProgressText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginTop: 8,
  },
  participateButton: {
    backgroundColor: "#72C3E0",
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  participateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmExitModalContent: {
    backgroundColor: "#3F3A76",
    borderRadius: 24,
    width: "100%",
    maxWidth: 400,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmExitTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
  },
  confirmExitDescription: {
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
    opacity: 0.9,
  },
  confirmExitButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#72C3E0",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  exitButton: {
    flex: 1,
    backgroundColor: "#E07272",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  exitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#72C3E0",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 36,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginTop: -4,
  },
  createChallengeScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  createChallengeModalContent: {
    backgroundColor: "#3F3A76",
    borderRadius: 24,
    width: "100%",
    maxWidth: 500,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createChallengeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 24,
  },
  formContainer: {
    width: "100%",
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
    marginTop: 12,
  },
  formInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#322D70",
    marginBottom: 8,
  },
  formTextArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  imagePickerButton: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 8,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePickerPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#72C3E0",
    borderStyle: "dashed",
    borderRadius: 12,
  },
  imagePickerText: {
    fontSize: 16,
    color: "#72C3E0",
    fontWeight: "600",
  },
  createButton: {
    backgroundColor: "#72C3E0",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  createButtonDisabled: {
    backgroundColor: "#999",
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#72C3E0",
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
})
