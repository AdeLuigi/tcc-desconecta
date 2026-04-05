import React, { useState } from "react"
import { View, StyleSheet, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator, ScrollView, Platform } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Icon } from "@/components/Icon"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAuth } from "@/context/AuthContext"
import * as ImagePicker from 'expo-image-picker'
import DateTimePicker from '@react-native-community/datetimepicker'
const Logo = require("@assets/images/logo2.png")

interface CriarNovoGrupoScreenProps extends AppStackScreenProps<"CriarNovoGrupo"> {}

export const CriarNovoGrupoScreen: React.FC<CriarNovoGrupoScreenProps> = ({ navigation, route }) => {
  const { userData } = useAuth()
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const selectedGroupType = route.params?.tipoGrupo ?? "comunidade"
  const isDesafio = selectedGroupType === "desafioTempo"
  
  // Data limite: 30 dias a partir de hoje (padrão)
  const defaultDeadline = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d
  })()
  const [dataLimite, setDataLimite] = useState<Date>(defaultDeadline)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const daysFromNow = Math.round(
    (dataLimite.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  )

  const formatDate = (date: Date) =>
    date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false)
    if (selectedDate) {
      setDataLimite(selectedDate)
    }
  }

  const openDatePicker = () => {
    setShowDatePicker(true)
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

  const uploadGroupImage = async (uri: string): Promise<string | null> => {
    try {
      setIsUploadingImage(true)
      const filename = `groups/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`
      const reference = (await import('@react-native-firebase/storage')).default().ref(filename)
      await reference.putFile(uri)
      const downloadURL = await reference.getDownloadURL()
      return downloadURL
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error)
      return null
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleNext = () => {
    if (!userData) {
      Alert.alert("Erro", "Você precisa estar logado para criar um grupo")
      return
    }
    if (!groupName.trim()) {
      Alert.alert("Atenção", "Digite um nome para o grupo")
      return
    }
    navigation.navigate("SelecionarCriterioGrupo", {
      tipoGrupo: selectedGroupType,
      groupName: groupName.trim(),
      groupDescription: groupDescription.trim(),
      selectedImageUri: selectedImage ?? undefined,
      dataLimite: isDesafio ? dataLimite.toISOString() : undefined,
    })
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={styles.container}>
      {/* Header */}
    <View style={styles.header}>
        <Image source={Logo} resizeMode="contain" />
        <TouchableOpacity onPress={() => navigation.navigate("Notificacoes")}>
        <Icon icon="notifications" size={24} color="#FFFFFF" />
        </TouchableOpacity>
    </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.titleCard}>
            <Icon icon="poepleGroupIcon" size={24} color="#322D70" />
            <Text style={styles.pageTitle}>{isDesafio ? "Criar desafio de grupo" : "Criar comunidade"}</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.label}>Preencha os dados básicos do grupo</Text>
          <View style={styles.imageSection}>
            
            {selectedImage ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setSelectedImage(null)}
                >
                  <Icon icon="x" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.addImageButton}>
                <Ionicons name="cloud-upload-outline" size={36} color="#94A3B8" />
                <TouchableOpacity
                  style={styles.selectImageButton}
                  onPress={pickImage}
                  disabled={isUploadingImage}
                >
                  {isUploadingImage ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.selectImageButtonText}>Selecione uma imagem</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Nome do Grupo */}
          <View style={styles.inputSection}>
            <TextInput
              style={styles.input}
              placeholder="Nome do Grupo"
              placeholderTextColor="#94A3B8"
              value={groupName}
              onChangeText={setGroupName}
              maxLength={50}
            />
          </View>

          {/* Descrição */}
          <View style={styles.inputSection}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descrição (opcional)"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={groupDescription}
              onChangeText={setGroupDescription}
              textAlignVertical="top"
              maxLength={200}
            />
          </View>

          {/* Data final — apenas para desafio de tempo */}
          {isDesafio && (
            <View style={styles.inputSection}>
              <TouchableOpacity
                style={styles.input}
                onPress={openDatePicker}
            >
                <Text style={styles.dateInputText}>{formatDate(dataLimite)}</Text>
              </TouchableOpacity>
              <Text style={styles.daysHint}>{daysFromNow} dias</Text>
              {showDatePicker && (
                <DateTimePicker
                  value={dataLimite}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  textColor="#1E293B"
                />
              )}
            </View>
          )}

        </View>
      </ScrollView>

      {/* Botões fixos no rodapé */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextButton, !groupName.trim() && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!groupName.trim()}
        >
          <Text style={styles.nextButtonText}>Próximo</Text>
        </TouchableOpacity>
      </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    padding: 20,
    alignItems: "center",
  },
  imageSection: {
    marginBottom: 24,
    width: "100%",
  },
  label: {
    fontSize: 16,
    fontWeight: "900",
    color: "#322D70",
    marginBottom: 12,
  },
  imagePreviewContainer: {
    position: "relative",
    alignItems: "center",
  },
  imagePreview: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#E0E7FF",
  },
    titleCard: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D7D7D7",
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginLeft:16,
    marginRight:16,
    marginTop: 16,
  },
    pageTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#322D70",
    marginLeft: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: "50%",
    marginRight: -83,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  addImageButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  selectImageButton: {
    backgroundColor: "#72C3E0",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  selectImageButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  inputSection: {
    marginBottom: 16,
    width: "100%",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: "#1E293B",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  bottomActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: "#F5F5F5",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  backButton: {
    flex: 1,
    borderRadius: 6,
    backgroundColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  nextButton: {
    flex: 1,
    borderRadius: 6,
    backgroundColor: "#7BC1DC",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  dateInputText: {
    fontSize: 15,
    color: "#1E293B",
  },
  daysHint: {
    fontSize: 13,
    color: "#322D70",
    marginTop: 4,
    marginLeft: 8,
    fontWeight: "900",
    marginBottom: 12,
    paddingHorizontal: 2,
  },
})
