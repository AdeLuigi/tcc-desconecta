import React, { useState, useEffect, useCallback } from "react"
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, Clipboard, Share } from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Icon } from "@/components/Icon"
import { FeedPosts } from "@/components/FeedPosts"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import { useAuth } from "@/context/AuthContext"
import { createFeedPost, type TipoAtividade } from "@/services/feedService"
import * as ImagePicker from 'expo-image-picker'
import storage from '@react-native-firebase/storage'
import { getFirestore, collection, query, where, getDocs } from "@react-native-firebase/firestore"
import ScreenTimeService from "@/services/screenTime"
import { getAppCategory } from "@/utils/appCategories"

interface DetalhesDoGrupoScreenProps extends AppStackScreenProps<"DetalhesDoGrupo"> {}

export const DetalhesDoGrupoScreen: React.FC<DetalhesDoGrupoScreenProps> = ({ navigation, route }) => {
  const { theme } = useAppTheme()
  const { grupo } = route.params
  const { userData } = useAuth()
  const [activeTab, setActiveTab] = useState<"info" | "feed">("info")
  const [modalVisible, setModalVisible] = useState(false)
  const [postDescription, setPostDescription] = useState("")
  const [selectedActivityType, setSelectedActivityType] = useState<TipoAtividade>("progresso")
  const [isCreatingPost, setIsCreatingPost] = useState(false)
  const [feedKey, setFeedKey] = useState(0)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [rankingTempoDeTela, setRankingTempoDeTela] = useState<Array<{
    userId: string
    nome: string
    tempoMinutos: number | null
    temHoje: boolean
  }>>([])
  const [loadingRanking, setLoadingRanking] = useState(false)

  // Ordenar ranking por pontos
  const rankingOrdenado = [...grupo.ranking_mensal].sort((a, b) => b.pontos - a.pontos)

  // Calcular estatísticas do grupo
  const totalPontos = grupo.ranking_mensal.reduce((sum, item) => sum + item.pontos, 0)
  const mediaPontos = Math.round(totalPontos / grupo.ranking_mensal.length)

  useFocusEffect(
    useCallback(() => {
      updateAndLoadRanking()
    }, [grupo.membros])
  )

  /**
   * Atualiza os dados de tempo de tela do usuário atual no Firestore
   */
  const updateScreenTimeData = async () => {
    if (!userData?.uid) return
    
    try {
      // Verificar permissão
      const hasPermission = await ScreenTimeService.hasPermission()
      if (!hasPermission) {
        console.log('Usuário não concedeu permissão para tempo de tela')
        return
      }

      // Buscar dados do dispositivo
      const [todayTime, apps] = await Promise.all([
        ScreenTimeService.getScreenTimeToday(),
        ScreenTimeService.getScreenTimeByApp(0), // 0 = apenas hoje
      ])

      if (todayTime > 0) {
        // Adicionar categoria aos apps
        const appsWithCategory = apps.map(app => ({
          ...app,
          category: getAppCategory(app.packageName, app.category),
        }))

        // Salvar no Firestore
        await ScreenTimeService.saveScreenTimeData(
          userData.uid,
          todayTime,
          appsWithCategory
        )
        console.log('Dados de tempo de tela atualizados com sucesso')
      }
    } catch (error) {
      console.error('Erro ao atualizar dados de tempo de tela:', error)
    }
  }

  /**
   * Atualiza os dados de tempo de tela e depois carrega o ranking
   */
  const updateAndLoadRanking = async () => {
    await updateScreenTimeData()
    await loadRankingTempoDeTela()
  }

  const loadRankingTempoDeTela = async () => {
    try {
      setLoadingRanking(true)
      const db = getFirestore()
      const hoje = new Date().toISOString().split('T')[0]
      
      const rankingData = await Promise.all(
        grupo.membros.map(async (membro) => {
          try {
            // Buscar dados de tempo de tela de hoje para este usuário
            const tempoTelaRef = collection(db, "estatisticas")
            const q = query(
              tempoTelaRef,
              where("userId", "==", membro.userId),
              where("data", "==", hoje)
            )
            
            const snapshot = await getDocs(q)
            
            if (!snapshot.empty) {
              const dados = snapshot.docs[0].data()
              return {
                userId: membro.userId,
                nome: membro.nome,
                tempoMinutos: dados.tempo_total_minutos,
                temHoje: true,
              }
            } else {
              return {
                userId: membro.userId,
                nome: membro.nome,
                tempoMinutos: null,
                temHoje: false,
              }
            }
          } catch (error) {
            console.error(`Erro ao buscar dados de ${membro.nome}:`, error)
            return {
              userId: membro.userId,
              nome: membro.nome,
              tempoMinutos: null,
              temHoje: false,
            }
          }
        })
      )
      
      // Ordenar: primeiro por quem tem dados de hoje, depois pelo menor tempo
      const rankingOrdenado = rankingData.sort((a, b) => {
        if (a.temHoje && !b.temHoje) return -1
        if (!a.temHoje && b.temHoje) return 1
        if (!a.temHoje && !b.temHoje) return 0
        return (a.tempoMinutos || 0) - (b.tempoMinutos || 0)
      })
      
      setRankingTempoDeTela(rankingOrdenado)
      console.log('Ranking de tempo de tela carregado:', rankingOrdenado)
    } catch (error) {
      console.error('Erro ao carregar ranking de tempo de tela:', error)
    } finally {
      setLoadingRanking(false)
    }
  }

  const formatarTempo = (minutos: number): string => {
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60
    
    if (horas === 0) return `${mins}min`
    if (mins === 0) return `${horas}h`
    return `${horas}h ${mins}min`
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
        aspect: [4, 3],
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

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      setIsUploadingImage(true)
      const filename = `feed/${grupo.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`
      const reference = storage().ref(filename)
      
      await reference.putFile(uri)
      const downloadURL = await reference.getDownloadURL()
      
      return downloadURL
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error)
      Alert.alert("Erro", "Não foi possível fazer upload da imagem")
      return null
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleCreatePost = async () => {
    if (!userData) {
      Alert.alert("Erro", "Você precisa estar logado para criar uma postagem")
      return
    }

    if (!postDescription.trim()) {
      Alert.alert("Atenção", "Digite uma descrição para a postagem")
      return
    }

    setIsCreatingPost(true)
    try {
      let photoURL: string | undefined = undefined
      
      // Se tiver imagem selecionada, faz upload primeiro
      if (selectedImage) {
        photoURL = await uploadImage(selectedImage) || undefined
        if (!photoURL) {
          // Se falhou o upload, pergunta se quer continuar sem a imagem
          Alert.alert(
            "Erro no upload",
            "Não foi possível fazer upload da imagem. Deseja publicar sem a foto?",
            [
              { text: "Cancelar", style: "cancel", onPress: () => setIsCreatingPost(false) },
              { 
                text: "Publicar sem foto", 
                onPress: async () => {
                  await createPostWithoutImage()
                }
              },
            ]
          )
          return
        }
      }

      const postId = await createFeedPost(
        grupo.id,
        userData.uid,
        userData.nome,
        postDescription.trim(),
        selectedActivityType,
        photoURL
      )

      if (postId) {
        Alert.alert("Sucesso", "Postagem criada com sucesso!")
        setModalVisible(false)
        setPostDescription("")
        setSelectedActivityType("progresso")
        setSelectedImage(null)
        // Forçar atualização do feed
        setFeedKey(prev => prev + 1)
      } else {
        Alert.alert("Erro", "Não foi possível criar a postagem")
      }
    } catch (error) {
      console.error("Erro ao criar postagem:", error)
      Alert.alert("Erro", "Ocorreu um erro ao criar a postagem")
    } finally {
      setIsCreatingPost(false)
    }
  }

  const createPostWithoutImage = async () => {
    try {
      const postId = await createFeedPost(
        grupo.id,
        userData!.uid,
        userData!.nome,
        postDescription.trim(),
        selectedActivityType
      )

      if (postId) {
        Alert.alert("Sucesso", "Postagem criada com sucesso!")
        setModalVisible(false)
        setPostDescription("")
        setSelectedActivityType("progresso")
        setSelectedImage(null)
        setFeedKey(prev => prev + 1)
      }
    } catch (error) {
      console.error("Erro ao criar postagem:", error)
    } finally {
      setIsCreatingPost(false)
    }
  }

  const activityTypes: { value: TipoAtividade; label: string; emoji: string }[] = [
    { value: "desafio_completo", label: "Desafio Completo", emoji: "🏆" },
    { value: "atividade_alternativa", label: "Atividade Alternativa", emoji: "🎯" },
    { value: "meta_atingida", label: "Meta Atingida", emoji: "✨" },
    { value: "progresso", label: "Progresso", emoji: "📈" },
    { value: "leitura", label: "Leitura", emoji: "📚" },
  ]

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
        {/* Group Header Card */}
        <View style={styles.groupHeaderCard}>
          <View style={styles.groupAvatarLarge}>
            {typeof grupo.foto === 'string' ? (
              <Image source={{ uri: grupo.foto }} style={styles.groupImage} />
            ) : (
              <Image source={grupo.foto} style={styles.groupImage} />
            )}
          </View>
          <Text style={styles.groupName}>{grupo.nome}</Text>
          <Text style={styles.groupMembers}>👥 {grupo.membros.length} membros</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => {
              Alert.alert(
                grupo.nome,
                grupo.descricao,
                [{ text: "OK" }]
              )
            }}
          >
            <View style={styles.quickActionIcon}>
              <Text style={styles.quickActionEmoji}>ℹ️</Text>
            </View>
            <Text style={styles.quickActionLabel}>Informações</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => {
              const membersList = grupo.membros.map((m, i) => 
                `${i + 1}. ${m.nome} ${m.cargo === 'administrador' ? '👑' : ''}`
              ).join('\n')
              Alert.alert(
                `Membros (${grupo.membros.length})`,
                membersList,
                [{ text: "OK" }]
              )
            }}
          >
            <View style={styles.quickActionIcon}>
              <Text style={styles.quickActionEmoji}>👥</Text>
            </View>
            <Text style={styles.quickActionLabel}>Membros</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => {
              const rankingList = rankingOrdenado.map((r, i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`
                return `${medal} ${r.nome} - ${r.pontos} pts`
              }).join('\n')
              Alert.alert(
                'Ranking Mensal 🏆',
                rankingList,
                [{ text: "OK" }]
              )
            }}
          >
            <View style={styles.quickActionIcon}>
              <Text style={styles.quickActionEmoji}>🏆</Text>
            </View>
            <Text style={styles.quickActionLabel}>Ranking</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => {
              if (grupo.codigoGrupo) {
                Alert.alert(
                  'Código do Grupo',
                  `${grupo.codigoGrupo}\n\nCompartilhe este código para que outros possam entrar no grupo.`,
                  [
                    { text: "Copiar", onPress: () => {
                      Clipboard.setString(grupo.codigoGrupo)
                      Alert.alert("Copiado!", "Código copiado para a área de transferência")
                    }},
                    { text: "Compartilhar", onPress: async () => {
                      try {
                        await Share.share({
                          message: `Junte-se ao grupo "${grupo.nome}" no Desconecta!\n\nCódigo: ${grupo.codigoGrupo}\n\nAbra o app e use este código para entrar no grupo.`,
                        })
                      } catch (error) {
                        console.error("Erro ao compartilhar:", error)
                      }
                    }},
                    { text: "Fechar", style: "cancel" }
                  ]
                )
              }
            }}
          >
            <View style={styles.quickActionIcon}>
              <Text style={styles.quickActionEmoji}>🔑</Text>
            </View>
            <Text style={styles.quickActionLabel}>Código</Text>
          </TouchableOpacity>
        </View>

        {/* Ranking de Hoje - Destaque Principal */}
        <View style={styles.highlightSection}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.highlightTitle}>Ranking de Hoje 📱</Text>
              <Text style={styles.highlightSubtitle}>
                Menos tempo de tela = melhor posição
              </Text>
            </View>
          </View>
          
          {loadingRanking ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#322D70" />
              <Text style={styles.loadingText}>Carregando ranking...</Text>
            </View>
          ) : rankingTempoDeTela.length > 0 ? (
            rankingTempoDeTela.map((item, index) => {
              const posicao = index + 1
              const medalha = posicao === 1 ? "🥇" : posicao === 2 ? "🥈" : posicao === 3 ? "🥉" : ""
              
              return (
                <View key={item.userId} style={styles.rankingCard}>
                  <View style={styles.rankingPosition}>
                    {medalha ? (
                      <Text style={styles.medalEmoji}>{medalha}</Text>
                    ) : (
                      <Text style={styles.positionNumber}>{posicao}º</Text>
                    )}
                  </View>
                  <View style={styles.rankingAvatar}>
                    <Text style={styles.rankingAvatarText}>
                      {item.nome.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.rankingInfo}>
                    <Text style={styles.rankingName}>{item.nome}</Text>
                    {item.temHoje ? (
                      <View style={styles.rankingPointsBar}>
                        <View 
                          style={[
                            styles.rankingPointsFill,
                            { 
                              width: rankingTempoDeTela[0].tempoMinutos && item.tempoMinutos 
                                ? `${Math.min((item.tempoMinutos / (rankingTempoDeTela[rankingTempoDeTela.length - 1].tempoMinutos || 1)) * 100, 100)}%`
                                : '0%',
                              backgroundColor: posicao <= 3 ? '#10B981' : '#6881BA'
                            }
                          ]} 
                        />
                      </View>
                    ) : (
                      <Text style={styles.noDataText}>Sem dados hoje</Text>
                    )}
                  </View>
                  {item.temHoje ? (
                    <Text style={styles.rankingPoints}>
                      {formatarTempo(item.tempoMinutos || 0)}
                    </Text>
                  ) : (
                    <View style={styles.noDataBadge}>
                      <Text style={styles.noDataBadgeText}>-</Text>
                    </View>
                  )}
                </View>
              )
            })
          ) : (
            <View style={styles.emptyRankingContainer}>
              <Text style={styles.emptyRankingText}>Nenhum dado disponível</Text>
            </View>
          )}
        </View>

        {/* Feed do Grupo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Feed do Grupo 💬</Text>
          <View style={styles.feedContainer}>
            <FeedPosts key={feedKey} groupId={grupo.id} />
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Botão Flutuante para Criar Postagem */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabButtonText}>+</Text>
      </TouchableOpacity>

      {/* Modal de Criar Postagem */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova Postagem</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                disabled={isCreatingPost}
              >
                <Icon icon="x" size={24} color="#322D70" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Tipo de Atividade</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.activityTypesScroll}
              >
                {activityTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.activityTypeChip,
                      selectedActivityType === type.value && styles.activityTypeChipActive,
                    ]}
                    onPress={() => setSelectedActivityType(type.value)}
                    disabled={isCreatingPost}
                  >
                    <Text style={styles.activityTypeEmoji}>{type.emoji}</Text>
                    <Text
                      style={[
                        styles.activityTypeLabel,
                        selectedActivityType === type.value && styles.activityTypeLabelActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Descrição</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Compartilhe seu progresso, conquista ou pensamento..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={6}
                value={postDescription}
                onChangeText={setPostDescription}
                textAlignVertical="top"
                editable={!isCreatingPost}
              />

              <Text style={styles.inputLabel}>Foto (opcional)</Text>
              {selectedImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setSelectedImage(null)}
                    disabled={isCreatingPost}
                  >
                    <Icon icon="x" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={pickImage}
                  disabled={isCreatingPost || isUploadingImage}
                >
                  <Text style={styles.addImageIcon}>📷</Text>
                  <Text style={styles.addImageText}>Adicionar foto</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
                disabled={isCreatingPost}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.postButton,
                  (isCreatingPost || !postDescription.trim()) && styles.postButtonDisabled,
                ]}
                onPress={handleCreatePost}
                disabled={isCreatingPost || !postDescription.trim()}
              >
                {isCreatingPost ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.postButtonText}>Publicar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  groupHeaderCard: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickActionEmoji: {
    fontSize: 24,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#322D70",
    textAlign: "center",
  },
  highlightSection: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  highlightTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#322D70",
    marginBottom: 4,
  },
  highlightSubtitle: {
    fontSize: 13,
    color: "#6881BA",
    marginBottom: 16,
  },
  sectionHeaderRow: {
    marginBottom: 12,
  },
  feedContainer: {
    flex: 1,
    minHeight: 400,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#322D70",
    marginBottom: 12,
  },
  groupAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 12,
  },
  groupImage: {
    width: "100%",
    height: "100%",
  },
  groupName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#322D70",
    marginBottom: 4,
    textAlign: "center",
  },
  groupMembers: {
    fontSize: 14,
    color: "#6881BA",
    textAlign: "center",
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
  codeSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginTop: 16,
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  codeBox: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  codeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#322D70",
    letterSpacing: 4,
  },
  codeActions: {
    gap: 8,
  },
  codeActionButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  codeHelper: {
    fontSize: 12,
    color: "#6881BA",
    marginTop: 8,
    lineHeight: 16,
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
  rankingSubtitle: {
    fontSize: 13,
    color: "#6881BA",
    marginBottom: 12,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: "#6881BA",
    marginLeft: 12,
  },
  noDataText: {
    fontSize: 12,
    color: "#94A3B8",
    fontStyle: "italic",
  },
  noDataBadge: {
    minWidth: 60,
    alignItems: "flex-end",
  },
  noDataBadgeText: {
    fontSize: 18,
    color: "#94A3B8",
  },
  emptyRankingContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyRankingText: {
    fontSize: 14,
    color: "#6881BA",
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
  fabButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#322D70",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabButtonText: {
    fontSize: 32,
    fontWeight: "300",
    color: "#FFFFFF",
    lineHeight: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#322D70",
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#322D70",
    marginBottom: 12,
  },
  activityTypesScroll: {
    marginBottom: 24,
  },
  activityTypeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    marginRight: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  activityTypeChipActive: {
    backgroundColor: "#E0E7FF",
    borderColor: "#322D70",
  },
  activityTypeEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  activityTypeLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },
  activityTypeLabelActive: {
    color: "#322D70",
    fontWeight: "600",
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: "#1E293B",
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
  },
  postButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#322D70",
    alignItems: "center",
    justifyContent: "center",
  },
  postButtonDisabled: {
    backgroundColor: "#94A3B8",
    opacity: 0.6,
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  imagePreviewContainer: {
    position: "relative",
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  addImageButton: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  addImageIcon: {
    fontSize: 48,
  },
  addImageText: {
    fontSize: 14,
    color: "#6881BA",
    fontWeight: "600",
    marginTop: 8,
  },
})
