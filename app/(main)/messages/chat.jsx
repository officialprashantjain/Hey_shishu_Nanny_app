import React, { useState, useRef, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";
import EmojiPicker from "rn-emoji-keyboard";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomImage as Image } from "../../../components/common/CustomImage";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors } from "../../../constants/color";
import { fonts } from "../../../constants/font";

const { width, height } = Dimensions.get("window");

export default function ActiveChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tutorName = params.name || "Parent";
  const scrollViewRef = useRef();

  const [messages, setMessages] = useState([
    {
      id: "1",
      sender: "parent",
      text: "Hi, how are the kids doing today?",
      time: "Saturday, 08:00 am",
      type: "text",
    },
    {
      id: "2",
      sender: "user",
      text: "They're great! We just finished playing in the park.",
      time: "Saturday, 08:05 am",
      type: "text",
    },
  ]);

  const [textInput, setTextInput] = useState("");
  const [showAttachmentSheet, setShowAttachmentSheet] = useState(false);
  const [showEmojiBar, setShowEmojiBar] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [playbackSeconds, setPlaybackSeconds] = useState(0);
  const [recording, setRecording] = useState(null);
  const [sound, setSound] = useState(null);

  const recordingTimerRef = useRef(null);
  const playbackTimerRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  const handleSend = (text, type = "text", meta = {}) => {
    if (!text && type === "text") return;

    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minStr = minutes < 10 ? "0" + minutes : minutes;
    const timeStr = `Today, ${hours}:${minStr} ${ampm}`;

    const newMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: text,
      time: timeStr,
      type: type,
      meta: meta,
    };

    setMessages((prev) => [...prev, newMessage]);
    setTextInput("");
    setShowEmojiBar(false);
    setShowAttachmentSheet(false);
  };

  const formatRecordingTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === "granted") {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY,
        );
        setRecording(recording);
        setIsRecording(true);
        setRecordingSeconds(0);

        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);
      } else {
        alert("Permission to record audio is required!");
      }
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopAndSendRecording = async () => {
    try {
      if (!recording) return;
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      const durationStr = formatRecordingTime(recordingSeconds);
      handleSend("Voice Note", "audio", { uri, duration: durationStr });
      setRecordingSeconds(0);
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  };

  const cancelRecording = async () => {
    try {
      if (!recording) return;
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

      await recording.stopAndUnloadAsync();
      setRecording(null);
      setRecordingSeconds(0);
    } catch (err) {
      console.error("Failed to cancel recording", err);
    }
  };

  const togglePlayAudio = async (msgId, uri) => {
    try {
      if (playingAudioId === msgId) {
        if (sound) {
          await sound.stopAsync();
          await sound.unloadAsync();
          setSound(null);
        }
        setPlayingAudioId(null);
      } else {
        if (sound) {
          await sound.unloadAsync();
          setSound(null);
        }
        setPlayingAudioId(msgId);

        const { sound: newSound } = await Audio.Sound.createAsync(
          {
            uri:
              uri ||
              "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          },
          { shouldPlay: true },
        );
        setSound(newSound);

        newSound.setOnPlaybackStatusUpdate(async (status) => {
          if (status.didJustFinish) {
            setPlayingAudioId(null);
            await newSound.unloadAsync();
            setSound(null);
          }
        });
      }
    } catch (error) {
      console.log("Error playing sound, simulating playback:", error);
      simulatePlaybackTimer(msgId);
    }
  };

  const simulatePlaybackTimer = (msgId) => {
    setPlayingAudioId(msgId);
    setPlaybackSeconds(0);
    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    playbackTimerRef.current = setInterval(() => {
      setPlaybackSeconds((prev) => {
        if (prev >= 10) {
          clearInterval(playbackTimerRef.current);
          setPlayingAudioId(null);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const pickImageOrVideo = async (mediaType) => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access photos is required!");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          mediaType === "image"
            ? ImagePicker.MediaTypeOptions.Images
            : ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const filename =
          asset.fileName ||
          (mediaType === "image" ? "photo_upload.jpg" : "video_upload.mp4");
        const durationSecs = asset.duration ? asset.duration / 1000 : 15;
        const mins = Math.floor(durationSecs / 60);
        const secs = Math.floor(durationSecs % 60);
        const durationStr = `${mins}:${secs.toString().padStart(2, "0")}`;

        handleSend(filename, mediaType, {
          uri: asset.uri,
          size: asset.fileSize
            ? `${(asset.fileSize / (1024 * 1024)).toFixed(1)} MB`
            : "1.2 MB",
          duration: durationStr,
        });
      }
    } catch (error) {
      console.log("Error picking media:", error);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        handleSend(asset.name, "document", {
          uri: asset.uri,
          size: asset.size
            ? `${(asset.size / (1024 * 1024)).toFixed(1)} MB`
            : "1.0 MB",
        });
      }
    } catch (error) {
      console.log("Error picking document:", error);
    }
  };

  const selectEmoji = (emojiObject) => {
    const emojiStr =
      typeof emojiObject === "string" ? emojiObject : emojiObject?.emoji;
    if (emojiStr) {
      setTextInput((prev) => prev + emojiStr);
    }
  };

  const triggerAttachment = (type) => {
    if (type === "document") {
      pickDocument();
    } else if (type === "image") {
      pickImageOrVideo("image");
    } else if (type === "video") {
      pickImageOrVideo("video");
    } else if (type === "audio") {
      startRecording();
    }
  };

  const handleNavToRequest = () => {
    router.push("/(main)/messages/request-session");
  };

  const startVideoCall = () => {
    router.push("/(main)/messages/incoming_call");
  };

  const startAudioCall = () => {
    router.push("/(main)/messages/incoming_call");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF6E6" }}>
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right", "bottom"]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.push("/(main)/messages")}
            style={styles.backButton}
          >
            <Image
              source={require("../../../assets/icons/left-arrow.svg")}
              style={styles.backIcon}
              tintColor={colors.description}
              contentFit="contain"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{tutorName}</Text>
        </View>

        <View style={styles.subHeaderInfoRow}>
          <TouchableOpacity
            style={styles.tutorInfoRowLeft}
            onPress={handleNavToRequest}
            activeOpacity={0.7}
          >
            <View style={styles.headerAvatarContainer}>
              <Image
                source={require("../../../assets/icons/nanny-image.svg")}
                style={styles.headerAvatar}
                contentFit="cover"
              />
              <View style={styles.offlineDot} />
            </View>
            <View style={styles.headerTextContainer}>
              <View style={styles.nameRow}>
                <Text style={styles.headerName}>{tutorName}</Text>
                <View style={styles.subjectBadge}>
                  <Text style={styles.subjectBadgeText}>
                    {params.subject || "Nanny"}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={startAudioCall}>
              <Image
                source={require("../../../assets/icons/call-message.svg")}
                style={styles.callIcon}
                tintColor="#334155"
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={startVideoCall}>
              <Image
                source={require("../../../assets/icons/video-call-message.svg")}
                style={styles.videoIcon}
                tintColor="#334155"
                contentFit="contain"
              />
            </TouchableOpacity>
          </View>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <ScrollView
            ref={scrollViewRef}
            style={styles.feed}
            contentContainerStyle={styles.feedContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg) => {
              const isUser = msg.sender === "user";

              return (
                <View
                  key={msg.id}
                  style={[
                    styles.messageRow,
                    isUser ? styles.userRow : styles.parentRow,
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      isUser ? styles.userBubble : styles.parentBubble,
                    ]}
                  >
                    {msg.type === "document" && (
                      <View style={styles.attachmentBadgeRow}>
                        <View style={styles.pdfIconCircle}>
                          <Text style={styles.pdfTextIcon}>PDF</Text>
                        </View>
                        <View style={styles.attachmentDetails}>
                          <Text
                            style={[
                              styles.attachmentNameText,
                              isUser ? styles.userText : styles.parentText,
                            ]}
                            numberOfLines={1}
                          >
                            {msg.text}
                          </Text>
                          <Text style={styles.attachmentSizeText}>
                            {msg.meta?.size || "1.2 MB"}
                          </Text>
                        </View>
                      </View>
                    )}

                    {msg.type === "image" && (
                      <View style={styles.imageAttachmentBox}>
                        <Image
                          source={{ uri: msg.meta?.uri }}
                          style={styles.attachmentImg}
                          contentFit="cover"
                        />
                        <Text
                          style={[
                            styles.imageLabelText,
                            isUser ? styles.userText : styles.parentText,
                          ]}
                        >
                          {msg.text}
                        </Text>
                      </View>
                    )}

                    {msg.type === "video" && (
                      <View style={styles.videoAttachmentBox}>
                        <View style={styles.videoPreview}>
                          {msg.meta?.uri && (
                            <Image
                              source={{ uri: msg.meta.uri }}
                              style={StyleSheet.absoluteFillObject}
                              contentFit="cover"
                            />
                          )}
                          <View style={styles.playIconCircle}>
                            <Image
                              source={require("../../../assets/icons/attachment.svg")}
                              style={styles.playBtnIcon}
                              tintColor="#FFFFFF"
                            />
                          </View>
                        </View>
                        <View style={styles.videoMetaDetails}>
                          <Text
                            style={[
                              styles.videoNameText,
                              isUser ? styles.userText : styles.parentText,
                            ]}
                            numberOfLines={1}
                          >
                            {msg.text}
                          </Text>
                          <Text style={styles.videoDurText}>
                            {msg.meta?.duration || "0:15"}
                          </Text>
                        </View>
                      </View>
                    )}

                    {msg.type === "audio" && (
                      <View style={styles.audioAttachmentRow}>
                        <TouchableOpacity
                          style={styles.audioPlayButton}
                          onPress={() => togglePlayAudio(msg.id, msg.meta?.uri)}
                        >
                          <Image
                            source={
                              playingAudioId === msg.id
                                ? require("../../../assets/icons/attachment.svg")
                                : require("../../../assets/icons/start.svg")
                            }
                            style={styles.voicePlayIcon}
                            tintColor="#346960"
                            contentFit="contain"
                          />
                        </TouchableOpacity>
                        <View style={styles.waveformContainer}>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(
                            (bar) => (
                              <View
                                key={bar}
                                style={[
                                  styles.waveBar,
                                  isUser && styles.userWave,
                                  playingAudioId === msg.id &&
                                    styles.playingWave,
                                  { height: 4 + Math.abs(Math.sin(bar)) * 16 },
                                ]}
                              />
                            ),
                          )}
                        </View>
                        <Text
                          style={[
                            styles.videoDurText,
                            isUser ? styles.userText : styles.parentText,
                          ]}
                        >
                          {msg.meta?.duration || "0:12"}
                        </Text>
                      </View>
                    )}

                    {msg.type === "text" && (
                      <Text
                        style={[
                          styles.messageText,
                          isUser ? styles.userText : styles.parentText,
                        ]}
                      >
                        {msg.text}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.msgTime}>{msg.time}</Text>
                </View>
              );
            })}
          </ScrollView>

          <EmojiPicker
            open={showEmojiBar}
            onClose={() => setShowEmojiBar(false)}
            onEmojiSelected={selectEmoji}
          />

          <View style={styles.inputDock}>
            <View style={styles.inputBarRow}>
              {isRecording ? (
                <View style={styles.recordingRowWrapper}>
                  <View style={styles.recordingBlinker}>
                    <View style={styles.redRecordDot} />
                    <Text style={styles.recordingTimerText}>
                      Recording... {formatRecordingTime(recordingSeconds)}
                    </Text>
                  </View>
                  <View style={styles.recordingControls}>
                    <TouchableOpacity
                      style={styles.cancelRecordBtn}
                      onPress={cancelRecording}
                    >
                      <Text style={styles.cancelRecordText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.sendRecordBtn}
                      onPress={stopAndSendRecording}
                    >
                      <Image
                        source={require("../../../assets/icons/send.svg")}
                        style={styles.sendIcon}
                        tintColor="#FFFFFF"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.textInputBoxWrapper}>
                    <TouchableOpacity
                      onPress={() => {
                        setShowEmojiBar(!showEmojiBar);
                        setShowAttachmentSheet(false);
                      }}
                    >
                      <Image
                        source={require("../../../assets/icons/emojis.svg")}
                        style={styles.emojisIconLeft}
                        contentFit="contain"
                        tintColor="#64748B"
                      />
                    </TouchableOpacity>

                    <TextInput
                      style={styles.chatTextInputField}
                      placeholder="Write your message..."
                      placeholderTextColor="#64748B"
                      value={textInput}
                      onChangeText={setTextInput}
                      onSubmitEditing={() => handleSend(textInput, "text")}
                    />
                  </View>

                  <View style={styles.rightControlsRow}>
                    <TouchableOpacity
                      style={styles.voiceTouchBtn}
                      onPress={() => triggerAttachment("audio")}
                    >
                      <Image
                        source={require("../../../assets/icons/audio.svg")}
                        style={styles.voiceMicIcon}
                        tintColor="#64748B"
                        contentFit="contain"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.voiceTouchBtn,
                        showAttachmentSheet && styles.actionBtnActive,
                      ]}
                      onPress={() => {
                        setShowAttachmentSheet(!showAttachmentSheet);
                        setShowEmojiBar(false);
                      }}
                    >
                      <Image
                        source={require("../../../assets/icons/attachment.svg")}
                        style={[
                          styles.voiceMicIcon,
                          showAttachmentSheet && {
                            transform: [{ rotate: "45deg" }],
                          },
                        ]}
                        tintColor="#64748B"
                        contentFit="contain"
                      />
                    </TouchableOpacity>

                    {textInput.trim().length > 0 && (
                      <TouchableOpacity
                        style={styles.sendButtonPrimary}
                        onPress={() => handleSend(textInput, "text")}
                      >
                        <Image
                          source={require("../../../assets/icons/send.svg")}
                          style={styles.sendIcon}
                          tintColor="#FFFFFF"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}
            </View>
          </View>

          {showAttachmentSheet && (
            <View style={{ marginBottom: Platform.OS === "ios" ? -34 : -50 }}>
              <SafeAreaView edges={["bottom"]} style={styles.sheetOverlay}>
                <View style={styles.sheetHandle} />
                <Text style={styles.sheetTitle}>Choose Attachment</Text>
                <View style={styles.attachmentOptionsGrid}>
                  <TouchableOpacity
                    style={styles.sheetOptionBtn}
                    onPress={() => triggerAttachment("document")}
                  >
                    <View
                      style={[
                        styles.sheetIconCircle,
                        { backgroundColor: "#DBEAFE" },
                      ]}
                    >
                      <Image
                        source={require("../../../assets/icons/terms-condition.svg")}
                        style={styles.sheetIcon}
                        tintColor="#2563EB"
                      />
                    </View>
                    <Text style={styles.sheetOptionLabel}>Document</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sheetOptionBtn}
                    onPress={() => triggerAttachment("image")}
                  >
                    <View
                      style={[
                        styles.sheetIconCircle,
                        { backgroundColor: "#FEE2E2" },
                      ]}
                    >
                      <Image
                        source={require("../../../assets/icons/upload-pic.svg")}
                        style={styles.sheetIcon}
                        tintColor="#EF4444"
                      />
                    </View>
                    <Text style={styles.sheetOptionLabel}>Photos</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sheetOptionBtn}
                    onPress={() => triggerAttachment("video")}
                  >
                    <View
                      style={[
                        styles.sheetIconCircle,
                        { backgroundColor: "#E0F2FE" },
                      ]}
                    >
                      <Image
                        source={require("../../../assets/icons/notification.svg")}
                        style={styles.sheetIcon}
                        tintColor="#0284C7"
                      />
                    </View>
                    <Text style={styles.sheetOptionLabel}>Videos</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sheetOptionBtn}
                    onPress={() => triggerAttachment("audio")}
                  >
                    <View
                      style={[
                        styles.sheetIconCircle,
                        { backgroundColor: "#F3E8FF" },
                      ]}
                    >
                      <Image
                        source={require("../../../assets/icons/support.svg")}
                        style={styles.sheetIcon}
                        tintColor="#9333EA"
                      />
                    </View>
                    <Text style={styles.sheetOptionLabel}>Audio Voice</Text>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF6E6",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    padding: 5,
    marginRight: 12,
  },
  backIcon: {
    width: 14,
    height: 14,
  },
  headerTitle: {
    fontFamily: fonts.rubikBold,
    fontSize: 20,
    color: colors.description,
    flex: 1,
    fontWeight: "bold",
  },
  subHeaderInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#FFF6E6",
  },
  tutorInfoRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerAvatarContainer: {
    position: "relative",
    width: 44,
    height: 44,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#D7DFE9",
  },
  offlineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: colors.white,
    backgroundColor: "#22C55E",
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  headerTextContainer: {
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerName: {
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: "#0F172A",
    fontWeight: "500",
  },
  subjectBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
  },
  subjectBadgeText: {
    fontFamily: fonts.rubik,
    fontSize: 10,
    color: "#475569",
  },
  headerIcons: {
    flexDirection: "row",
    gap: 20,
  },
  callIcon: {
    width: 18,
    height: 18,
  },
  videoIcon: {
    width: 22,
    height: 16,
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  messageRow: {
    marginBottom: 20,
    maxWidth: width * 0.75,
  },
  parentRow: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  userRow: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: "rgba(52, 64, 84, 0.08)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  parentBubble: {
    backgroundColor: colors.white,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  userBubble: {
    backgroundColor: "#FF73A7",
    borderTopLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderWidth: 1,
    borderColor: colors.white,
    shadowColor: "rgba(0, 0, 0, 0.16)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  messageText: {
    fontFamily: fonts.rubik,
    fontSize: 12,
    lineHeight: 20,
  },
  parentText: {
    color: "#475569",
  },
  userText: {
    color: colors.white,
  },
  msgTime: {
    fontFamily: fonts.rubik,
    fontSize: 10,
    color: "#64748B",
    marginTop: 4,
  },
  inputDock: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 34 : 12,
  },
  inputBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rightControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  textInputBoxWrapper: {
    flex: 1,
    backgroundColor: colors.white,
    height: 44,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
    shadowColor: "rgba(52, 64, 84, 0.08)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  emojisIconLeft: {
    width: 20,
    height: 20,
  },
  chatTextInputField: {
    flex: 1,
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: "#0F172A",
  },
  sendButtonPrimary: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "rgba(0, 0, 0, 0.16)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  sendIcon: {
    width: 18,
    height: 18,
  },
  voiceTouchBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
  },
  voiceMicIcon: {
    width: 20,
    height: 20,
  },
  recordingRowWrapper: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    height: 44,
    borderRadius: 100,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  recordingBlinker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  redRecordDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  recordingTimerText: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "600",
  },
  recordingControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cancelRecordBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  cancelRecordText: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  sendRecordBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#059669",
    justifyContent: "center",
    alignItems: "center",
  },
  playingWave: {
    backgroundColor: "#346960",
    borderColor: "#346960",
  },
  sheetOverlay: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 25,
    paddingHorizontal: 24,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sheetHandle: {
    width: 48,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: fonts.rubik,
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 20,
    textAlign: "center",
  },
  attachmentOptionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
  },
  sheetOptionBtn: {
    alignItems: "center",
    gap: 8,
  },
  sheetIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  sheetIcon: {
    width: 22,
    height: 22,
  },
  sheetOptionLabel: {
    fontFamily: fonts.rubik,
    fontSize: 12,
    color: "#475569",
  },
  attachmentBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pdfIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  pdfTextIcon: {
    fontFamily: fonts.rubik,
    fontSize: 10,
    fontWeight: "700",
    color: "#EF4444",
  },
  attachmentDetails: {
    flex: 1,
  },
  attachmentNameText: {
    fontFamily: fonts.rubik,
    fontSize: 12,
    fontWeight: "500",
  },
  attachmentSizeText: {
    fontFamily: fonts.rubik,
    fontSize: 10,
    color: "#94A3B8",
  },
  imageAttachmentBox: {
    gap: 8,
  },
  attachmentImg: {
    width: 180,
    height: 120,
    borderRadius: 8,
  },
  imageLabelText: {
    fontFamily: fonts.rubik,
    fontSize: 11,
  },
  videoAttachmentBox: {
    width: 180,
    gap: 6,
  },
  videoPreview: {
    width: 180,
    height: 100,
    backgroundColor: "#0F172A",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  playIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  playBtnIcon: {
    width: 14,
    height: 14,
    marginLeft: 2,
  },
  videoMetaDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  videoNameText: {
    fontFamily: fonts.rubik,
    fontSize: 11,
    flex: 1,
  },
  videoDurText: {
    fontFamily: fonts.rubik,
    fontSize: 9,
    color: "#94A3B8",
  },
  audioAttachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: 160,
  },
  audioPlayButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  voicePlayIcon: {
    width: 10,
    height: 10,
    marginLeft: 1,
  },
  waveformContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  waveBar: {
    width: 3,
    backgroundColor: "#64748B",
    borderRadius: 2,
  },
  userWave: {
    backgroundColor: colors.white,
  },
  actionBtnActive: {
    backgroundColor: "#E2E8F0",
  },
});
