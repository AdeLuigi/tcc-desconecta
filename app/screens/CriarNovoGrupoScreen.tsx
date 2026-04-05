import React, { useState } from "react"
import { View, StyleSheet, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator, ScrollView } from "react-native"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Icon } from "@/components/Icon"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAuth } from "@/context/AuthContext"
import { createGroup } from "@/services/groupService"
import * as ImagePicker from 'expo-image-picker'
import storage from '@react-native-firebase/storage'
const Logo = require("@assets/images/logo2.png")

interface CriarNovoGrupoScreenProps extends AppStackScreenProps<"CriarNovoGrupo"> {}

export const CriarNovoGrupoScreen: React.FC<CriarNovoGrupoScreenProps> = ({ navigation, route }) => {
  const { userData } = useAuth()
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const selectedGroupType = route.params?.tipoGrupo ?? "comunidade"

  const getDefaultDeadline = () => {
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + 30)
    return deadline.toISOString()
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
      const reference = storage().ref(filename)
      
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

  const handleCreateGroup = async () => {
    if (!userData) {
      Alert.alert("Erro", "Você precisa estar logado para criar um grupo")
      return
    }

    if (!groupName.trim()) {
      Alert.alert("Atenção", "Digite um nome para o grupo")
      return
    }

    if (!groupDescription.trim()) {
      Alert.alert("Atenção", "Digite uma descrição para o grupo")
      return
    }

    setIsCreating(true)
    try {
      let photoURL = ""
      
      // Se tiver imagem selecionada, faz upload primeiro
      if (selectedImage) {
        const uploadedURL = await uploadGroupImage(selectedImage)
        if (uploadedURL) {
          photoURL = uploadedURL
        } else {
          Alert.alert(
            "Aviso",
            "Não foi possível fazer upload da imagem. O grupo será criado sem foto."
          )
        }
      }

      const groupId = await createGroup(
        groupName.trim(),
        groupDescription.trim(),
        photoURL,
        userData.uid,
        selectedGroupType === "desafioTempo" ? getDefaultDeadline() : undefined,
      )

      if (groupId) {
        Alert.alert(
          "Sucesso!",
          "Grupo criado com sucesso!",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("HomeDinamica")
            }
          ]
        )
      } else {
        Alert.alert("Erro", "Não foi possível criar o grupo")
      }
    } catch (error) {
      console.error("Erro ao criar grupo:", error)
      Alert.alert("Erro", "Ocorreu um erro ao criar o grupo")
    } finally {
      setIsCreating(false)
    }
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
            <Text style={styles.pageTitle}>Criar desafio de grupo</Text>
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
                  disabled={isCreating}
                >
                  <Icon icon="x" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={pickImage}
                disabled={isCreating || isUploadingImage}
              >
                <Icon icon="uploadIcone" size={16} color="#FFFFFF" />
                <View style={{backgroundColor:"#72C3E0", alignItems:"center", justifyContent:"center", padding:4, borderRadius:8, marginTop:8  }}>
                  <Text style={[styles.addImageText, {color: "#FFFFFF"}]}>Selecione uma imagem</Text>
                </View>
              </TouchableOpacity>
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
              editable={!isCreating}
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
              editable={!isCreating}
              maxLength={200}
            />
          </View>

          {/* Botões */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={isCreating}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.createButton,
                (isCreating || !groupName.trim() || !groupDescription.trim()) && styles.createButtonDisabled,
              ]}
              onPress={handleCreateGroup}
              disabled={isCreating || !groupName.trim() || !groupDescription.trim()}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.createButtonText}>Criar Grupo</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
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
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  addImageIcon: {
    fontSize: 48,
  },
  addImageText: {
    fontSize: 14,
    color: "#6881BA",
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
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
  },
  createButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#322D70",
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonDisabled: {
    backgroundColor: "#94A3B8",
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
})
