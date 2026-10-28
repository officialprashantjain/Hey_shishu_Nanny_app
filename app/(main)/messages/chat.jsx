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
  Alert,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomImage as Image } from "../../../src/components/common/CustomImage";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors } from "../../../constants/color";
import { fonts } from "../../../constants/font";
import { initiateOutgoingCall } from "../../../src/utils/callLauncher";
import useChatCallMedia from "../../../src/hooks/useChatCallMedia";
import socketService from "../../../src/services/socketService";
import chatService from "../../../src/services/chatService";
import { getSession } from "../../../src/utils/storage";

const { width, height } = Dimensions.get("window");

const formatFileSize = (size) => {
  if (!size) return "";
  if (typeof size === "string" && (size.includes("KB") || size.includes("MB") || size.includes("Bytes") || size.includes("B"))) {
    return size;
  }
  const bytes = Number(size);
  if (isNaN(bytes) || bytes <= 0) return typeof size === "string" ? size : "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getDocumentInfo = (filename, uri) => {
  const name = String(filename || uri || "");
  const ext = name.includes(".") ? name.split(".").pop().toLowerCase().split("?")[0] : "pdf";
  if (["pdf"].includes(ext)) {
    return { ext: "PDF", bg: "#FEE2E2", color: "#EF4444" };
  }
  if (["doc", "docx"].includes(ext)) {
    return { ext: "DOC", bg: "#E0F2FE", color: "#0284C7" };
  }
  if (["xls", "xlsx", "csv"].includes(ext)) {
    return { ext: "XLS", bg: "#DCFCE7", color: "#16A34A" };
  }
  if (["png", "jpg", "jpeg", "webp"].includes(ext)) {
    return { ext: "IMG", bg: "#FEF3C7", color: "#D97706" };
  }
  return { ext: ext.toUpperCase().slice(0, 4) || "DOC", bg: "#F1F5F9", color: "#475569" };
};

const mapServerMessageToClient = (msg, currentId) => {
  const isUser = String(msg.senderId) === String(currentId);
  const d = msg.createdAt ? new Date(msg.createdAt) : new Date();
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;
  const minStr = minutes < 10 ? "0" + minutes : minutes;
  const timeStr = `Today, ${hours}:${minStr} ${ampm}`;

  const resolvedFilename = msg.media?.filename || msg.text || (msg.messageType === "document" ? "Document.pdf" : "");

  return {
    id: String(msg._id || msg.clientTempId || Math.random()),
    serverMessageId: msg._id,
    clientTempId: msg.clientTempId,
    sender: isUser ? "user" : "other",
    text: msg.text || resolvedFilename || "",
    time: timeStr,
    type: msg.messageType || "text",
    status: msg.status || "sent",
    meta: msg.media
      ? {
          uri: msg.media.url,
          filename: resolvedFilename,
          size: msg.media.size,
          duration: msg.media.duration,
          mimeType: msg.media.mimeType,
        }
      : null,
    callInfo: msg.callInfo || null,
  };
};

export default function ActiveChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tutorName = params.name || "Parent";
  const scrollViewRef = useRef();

  const [activeConvId, setActiveConvId] = useState(params.conversationId || null);
  const [activeReceiverId, setActiveReceiverId] = useState(
    params.receiverId || params.parentId || params.userId || null
  );
  const [activeReceiverRole, setActiveReceiverRole] = useState(params.receiverRole || "parent");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isRecipientOnline, setIsRecipientOnline] = useState(false);
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const [loadingChat, setLoadingChat] = useState(true);
  const typingTimerRef = useRef(null);

  const [messages, setMessages] = useState([]);

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
  const activeConvIdRef = useRef(activeConvId);
  activeConvIdRef.current = activeConvId;
  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;
  const isInitializingRef = useRef(false);

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

  const incomingReceiverId = params.receiverId || params.parentId || params.userId || null;
  const incomingConvId = params.conversationId || null;

  useEffect(() => {
    if (incomingReceiverId && incomingReceiverId !== activeReceiverId) {
      setActiveReceiverId(incomingReceiverId);
      isInitializingRef.current = false;
    }
    if (incomingConvId && incomingConvId !== activeConvId) {
      setActiveConvId(incomingConvId);
      activeConvIdRef.current = incomingConvId;
      isInitializingRef.current = false;
    }
  }, [incomingReceiverId, incomingConvId]);

  // Connect Socket & Initialize Conversation on Mount (guarded against concurrency)
  useEffect(() => {
    let isMounted = true;

    async function initChat() {
      if (isInitializingRef.current) return;
      isInitializingRef.current = true;

      try {
        const session = await getSession();
        const myId = session?.user?._id || session?.user?.id;
        if (myId && isMounted) {
          setCurrentUserId(String(myId));
          currentUserIdRef.current = String(myId);
        }

        await socketService.connect();

        let convId = activeConvIdRef.current;
        const recId = activeReceiverId;

        if (!convId && recId) {
          const convRes = await chatService.getOrCreateConversation({
            receiverId: recId,
            receiverRole: activeReceiverRole,
            bookingId: params.bookingId || null,
          });
          convId = convRes?._id;
          if (convId && isMounted) {
            setActiveConvId(convId);
            activeConvIdRef.current = convId;
          }
        }

        if (convId) {
          socketService.emit("join_conversation", { conversationId: convId });

          const history = await chatService.getMessages(convId, { limit: 50 });
          if (isMounted) {
            const mapped = history.messages.map((m) => mapServerMessageToClient(m, myId));
            setMessages(mapped);
            setLoadingChat(false);
          }

          socketService.emit("mark_as_read", { conversationId: convId });
        } else {
          if (isMounted) setLoadingChat(false);
        }
      } catch (err) {
        console.warn("[Nanny ActiveChatScreen] initChat error:", err);
        if (isMounted) setLoadingChat(false);
      } finally {
        isInitializingRef.current = false;
      }
    }

    initChat();
  }, [activeReceiverId]);

  // Active socket listeners for real-time messages & presence
  useEffect(() => {
    if (!activeConvId) return;

    socketService.emit("join_conversation", { conversationId: activeConvId });

    const handleNewMessage = (newMsg) => {
      if (String(newMsg.conversationId) === String(activeConvIdRef.current)) {
        setMessages((prev) => {
          const existingIdx = prev.findIndex(
            (m) =>
              (newMsg.clientTempId && m.clientTempId === newMsg.clientTempId) ||
              (newMsg._id && String(m.serverMessageId) === String(newMsg._id))
          );
          const mapped = mapServerMessageToClient(newMsg, currentUserIdRef.current);
          if (existingIdx !== -1) {
            const updated = [...prev];
            updated[existingIdx] = mapped;
            return updated;
          }
          return [...prev, mapped];
        });

        if (String(newMsg.senderId) !== String(currentUserIdRef.current)) {
          socketService.emit("mark_as_read", {
            conversationId: activeConvIdRef.current,
            messageIds: [newMsg._id],
          });
        }
      }
    };

    const handleMessageAck = (ack) => {
      if (ack?.clientTempId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.clientTempId === ack.clientTempId
              ? { ...m, serverMessageId: ack.messageId, status: "sent" }
              : m
          )
        );
      }
    };

    const handleMessagesRead = (readData) => {
      if (String(readData.conversationId) === String(activeConvIdRef.current)) {
        setMessages((prev) =>
          prev.map((m) => (m.sender === "user" ? { ...m, status: "read" } : m))
        );
      }
    };

    const handleUserTyping = (data) => {
      if (String(data.conversationId) === String(activeConvIdRef.current)) {
        if (String(data.userId) !== String(currentUserIdRef.current)) {
          setOtherIsTyping(Boolean(data.isTyping));
        }
      }
    };

    const handleUserPresence = (data) => {
      if (activeReceiverId && String(data.userId) === String(activeReceiverId)) {
        setIsRecipientOnline(Boolean(data.isOnline));
      }
    };

    socketService.on("new_message", handleNewMessage);
    socketService.on("message_ack", handleMessageAck);
    socketService.on("messages_read", handleMessagesRead);
    socketService.on("user_typing", handleUserTyping);
    socketService.on("user_presence", handleUserPresence);

    return () => {
      if (activeConvId) {
        socketService.emit("leave_conversation", { conversationId: activeConvId });
      }
      socketService.off("new_message", handleNewMessage);
      socketService.off("message_ack", handleMessageAck);
      socketService.off("messages_read", handleMessagesRead);
      socketService.off("user_typing", handleUserTyping);
      socketService.off("user_presence", handleUserPresence);
    };
  }, [activeConvId, activeReceiverId]);

  const mediaRef = useChatCallMedia(() => {
    clearInterval(recordingTimerRef.current);
    clearInterval(playbackTimerRef.current);
    setRecording(null);
    setSound(null);
    setIsRecording(false);
    setRecordingSeconds(0);
    setPlayingAudioId(null);
  });

  const handleSend = async (text, type = "text", meta = {}) => {
    if (!text && type === "text") return;

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12 || 12;
    const minStr = minutes < 10 ? "0" + minutes : minutes;
    const timeStr = `Today, ${hours}:${minStr} ${ampm}`;

    const optimisticMessage = {
      id: tempId,
      clientTempId: tempId,
      sender: "user",
      text: text,
      time: timeStr,
      type: type,
      status: "sending",
      meta: meta,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setTextInput("");
    setShowEmojiBar(false);
    setShowAttachmentSheet(false);

    try {
      let mediaPayload = null;
      if (type !== "text" && meta?.uri) {
        const uploadRes = await chatService.uploadAttachment(
          meta.uri,
          meta.filename || text,
          meta.mimeType
        );
        if (uploadRes?.url) {
          mediaPayload = {
            url: uploadRes.url,
            filename: uploadRes.filename || text,
            size: meta.size || "",
            duration: meta.duration || "",
            mimeType: uploadRes.mimeType || "",
          };
        }
      }

      socketService.emit("send_message", {
        conversationId: activeConvId,
        receiverId: activeReceiverId,
        receiverRole: activeReceiverRole,
        text: type === "text" ? text : (meta?.filename || text || "Attachment"),
        messageType: type,
        media: mediaPayload,
        clientTempId: tempId,
      });

      if (activeConvId) {
        socketService.emit("typing_stop", { conversationId: activeConvId });
      }
    } catch (err) {
      console.error("[handleSend Nanny] Error:", err);
    }
  };

  const handleOpenDocument = async (url, filename = "document") => {
    if (!url) {
      Alert.alert("File Not Found", "Attachment link is not available.");
      return;
    }
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(url);
      }
    } catch (err) {
      console.warn("[handleOpenDocument] Linking error:", err);
      Alert.alert("Unable to open", "Could not open document in mobile viewer/browser.");
    }
  };

  const handleTypingChange = (text) => {
    setTextInput(text);
    if (!activeConvId) return;

    socketService.emit("typing_start", { conversationId: activeConvId });

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketService.emit("typing_stop", { conversationId: activeConvId });
    }, 2000);
  };


  const formatRecordingTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    mediaRef.current.cancelled = false;
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === "granted") {
        if (mediaRef.current.cancelled) return;
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        if (mediaRef.current.cancelled) return;
        const pendingRecording = Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        mediaRef.current.pendingRecording = pendingRecording;
        const { recording } = await pendingRecording;
        mediaRef.current.recording = recording;
        mediaRef.current.pendingRecording = null;
        if (mediaRef.current.cancelled) return;
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
      mediaRef.current.pendingRecording = null;
      console.error("Failed to start recording", err);
    }
  };

  const stopAndSendRecording = async () => {
    try {
      if (!recording) return;
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

      const stopping = recording.stopAndUnloadAsync();
      mediaRef.current.pendingRecordingStop = stopping;
      await stopping;
      mediaRef.current.pendingRecordingStop = null;
      const durationStr = formatRecordingTime(recordingSeconds);
      const ext = uri ? uri.split('.').pop().toLowerCase().split('?')[0] : 'm4a';
      const cleanExt = ['m4a', 'aac', 'mp3', 'wav', 'caf'].includes(ext) ? ext : 'm4a';
      const filename = `voice-note-${Date.now()}.${cleanExt}`;

      handleSend("Voice Note", "audio", {
        uri,
        filename,
        duration: durationStr,
        mimeType: `audio/${cleanExt === 'mp3' ? 'mpeg' : cleanExt}`,
      });
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

      const stopping = recording.stopAndUnloadAsync();
      mediaRef.current.pendingRecordingStop = stopping;
      await stopping;
      mediaRef.current.pendingRecordingStop = null;
      mediaRef.current.recording = null;
      setRecording(null);
      setRecordingSeconds(0);
    } catch (err) {
      console.error("Failed to cancel recording", err);
    }
  };

  const togglePlayAudio = async (msgId, uri) => {
    mediaRef.current.cancelled = false;
    try {
      if (playingAudioId === msgId) {
        if (sound) {
          await sound.stopAsync();
          await sound.unloadAsync();
          mediaRef.current.sound = null;
          setSound(null);
        }
        setPlayingAudioId(null);
      } else {
        if (sound) {
          await sound.unloadAsync();
          mediaRef.current.sound = null;
          setSound(null);
        }
        setPlayingAudioId(msgId);

        const { sound: newSound } = await Audio.Sound.createAsync(
          {
            uri:
              uri ||
              "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          },
          { shouldPlay: false },
        );
        if (mediaRef.current.cancelled) { await newSound.unloadAsync(); return; }
        mediaRef.current.sound = newSound;
        await newSound.playAsync();
        setSound(newSound);

        newSound.setOnPlaybackStatusUpdate(async (status) => {
          if (status.didJustFinish) {
            setPlayingAudioId(null);
            await newSound.unloadAsync();
            mediaRef.current.sound = null;
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
        const rawUri = asset.uri || '';
        const uriExt = rawUri.includes('.') ? rawUri.split('.').pop().toLowerCase().split('?')[0] : '';
        const defaultExt = mediaType === 'image' ? 'jpg' : 'mp4';
        const ext = uriExt && uriExt.length <= 4 ? uriExt : defaultExt;

        let filename = asset.fileName;
        if (!filename) {
          filename = `${mediaType}_upload_${Date.now()}.${ext}`;
        } else if (!filename.includes('.')) {
          filename = `${filename}.${ext}`;
        }

        const durationSecs = asset.duration ? asset.duration / 1000 : 15;
        const mins = Math.floor(durationSecs / 60);
        const secs = Math.floor(durationSecs % 60);
        const durationStr = `${mins}:${secs.toString().padStart(2, "0")}`;

        handleSend(filename, mediaType, {
          uri: asset.uri,
          filename: filename,
          mimeType: asset.mimeType || (mediaType === 'image' ? `image/${ext === 'jpg' ? 'jpeg' : ext}` : 'video/mp4'),
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
        const rawUri = asset.uri || '';
        const uriExt = rawUri.includes('.') ? rawUri.split('.').pop().toLowerCase().split('?')[0] : 'pdf';
        let filename = asset.name || `document_${Date.now()}.${uriExt}`;
        if (!filename.includes('.')) {
          filename = `${filename}.${uriExt}`;
        }

        handleSend(filename, "document", {
          uri: asset.uri,
          filename: filename,
          mimeType: asset.mimeType || 'application/pdf',
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

  const handleStartCall = (callType) => initiateOutgoingCall({
    router,
    receiverId: activeReceiverId || params.receiverId || params.parentId || params.nannyId || params.id || params.userId,
    receiverName: tutorName,
    receiverPhoto: params.photo || params.remotePhoto || '',
    bookingId: params.bookingId || null,
    callType,
  });

  const startVideoCall = () => handleStartCall("video");
  const startAudioCall = () => handleStartCall("audio");

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
                source={params.photo ? { uri: params.photo } : require("../../../assets/icons/nanny-image.svg")}
                style={styles.headerAvatar}
                contentFit="cover"
              />
              <View style={[styles.offlineDot, { backgroundColor: isRecipientOnline ? "#22C55E" : "#94A3B8" }]} />
            </View>
            <View style={styles.headerTextContainer}>
              <View style={styles.nameRow}>
                <Text style={styles.headerName}>{tutorName}</Text>
                <View style={styles.subjectBadge}>
                  <Text style={styles.subjectBadgeText}>
                    {params.subject || (activeReceiverRole === "parent" ? "Parent" : "Nanny")}
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
                    {msg.type === "document" && (() => {
                      const docFilename = msg.meta?.filename || msg.text || "Document.pdf";
                      const docUri = msg.meta?.uri || "";
                      const docInfo = getDocumentInfo(docFilename, docUri);
                      const sizeText = formatFileSize(msg.meta?.size);

                      return (
                        <TouchableOpacity
                          activeOpacity={0.75}
                          style={styles.attachmentCardBtn}
                          onPress={() => handleOpenDocument(docUri, docFilename)}
                        >
                          <View style={[styles.pdfIconCircle, { backgroundColor: docInfo.bg }]}>
                            <Text style={[styles.pdfTextIcon, { color: docInfo.color }]}>
                              {docInfo.ext}
                            </Text>
                          </View>
                          <View style={styles.attachmentDetails}>
                            <Text
                              style={[
                                styles.attachmentNameText,
                                isUser ? styles.userText : styles.parentText,
                              ]}
                              numberOfLines={1}
                              ellipsizeMode="middle"
                            >
                              {docFilename}
                            </Text>
                            <Text
                              style={[
                                styles.attachmentSizeText,
                                isUser && { color: "rgba(255, 255, 255, 0.8)" },
                              ]}
                            >
                              {sizeText ? `${sizeText} • ` : ""}Tap to open / download
                            </Text>
                          </View>
                          <View style={[styles.downloadIconBadge, isUser && styles.userDownloadBadge]}>
                            <Text style={[styles.downloadArrowText, isUser && { color: "#FFFFFF" }]}>
                              ⬇
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })()}

                    {msg.type === "image" && (
                      <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.imageAttachmentBox}
                        onPress={() => handleOpenDocument(msg.meta?.uri, msg.meta?.filename || "photo.jpg")}
                      >
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
                          numberOfLines={1}
                        >
                          {msg.meta?.filename || msg.text || "Photo"}
                        </Text>
                      </TouchableOpacity>
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

                    {msg.type === "call" && (() => {
                      const isVideo = msg.callInfo?.callType === "video" || msg.text?.toLowerCase().includes("video");
                      const callStatus = msg.callInfo?.status || (msg.text?.toLowerCase().includes("missed") ? "missed" : "completed");
                      const durationSec = Number(msg.callInfo?.duration) || 0;
                      const isMissed = callStatus === "missed" || (!isUser && durationSec === 0 && callStatus !== "completed");
                      const isDeclined = callStatus === "declined";
                      const isCancelled = callStatus === "cancelled";

                      let callTitle = isVideo ? "Video Call" : "Voice Call";
                      if (isMissed) {
                        callTitle = isVideo ? "Missed Video Call" : "Missed Voice Call";
                      } else if (isDeclined) {
                        callTitle = isVideo ? "Declined Video Call" : "Declined Voice Call";
                      }

                      const formatCallDur = (sec) => {
                        if (!sec || sec <= 0) return null;
                        const mins = Math.floor(sec / 60);
                        const s = sec % 60;
                        return mins > 0 ? `${mins}m ${s}s` : `${s}s`;
                      };

                      const durStr = formatCallDur(durationSec);

                      return (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          style={styles.callCardBtn}
                          onPress={() => (isVideo ? startVideoCall() : startAudioCall())}
                        >
                          <View
                            style={[
                              styles.callIconCircle,
                              isMissed
                                ? styles.callIconMissed
                                : isUser
                                ? styles.callIconUser
                                : styles.callIconOther,
                            ]}
                          >
                            <Ionicons
                              name={isVideo ? "videocam" : "call"}
                              size={20}
                              color={isMissed ? "#EF4444" : isUser ? "#FFFFFF" : colors.primary}
                            />
                          </View>

                          <View style={styles.callDetailsCol}>
                            <Text
                              style={[
                                styles.callTitleText,
                                isMissed
                                  ? { color: "#EF4444" }
                                  : isUser
                                  ? styles.userText
                                  : styles.parentText,
                              ]}
                              numberOfLines={1}
                            >
                              {callTitle}
                            </Text>
                            <View style={styles.callSubRow}>
                              <Ionicons
                                name={
                                  isMissed
                                    ? "arrow-down"
                                    : isUser
                                    ? "arrow-up"
                                    : "arrow-down"
                                }
                                size={12}
                                color={
                                  isMissed
                                    ? "#EF4444"
                                    : isUser
                                    ? "rgba(255, 255, 255, 0.85)"
                                    : "#64748B"
                                }
                                style={{ marginRight: 4 }}
                              />
                              <Text
                                style={[
                                  styles.callSubText,
                                  isMissed
                                    ? { color: "#EF4444" }
                                    : isUser
                                    ? { color: "rgba(255, 255, 255, 0.85)" }
                                    : { color: "#64748B" },
                                ]}
                              >
                                {durStr || (isMissed ? "Missed" : isDeclined ? "Declined" : isCancelled ? "Cancelled" : "Call ended")}
                              </Text>
                            </View>
                          </View>

                          <TouchableOpacity
                            style={[
                              styles.callActionBadge,
                              isUser && styles.userCallActionBadge,
                            ]}
                            onPress={() => (isVideo ? startVideoCall() : startAudioCall())}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons
                              name={isVideo ? "videocam-outline" : "call-outline"}
                              size={16}
                              color={isUser ? "#FFFFFF" : colors.primary}
                            />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      );
                    })()}

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

          {otherIsTyping && (
            <View style={{ paddingHorizontal: 24, paddingVertical: 4 }}>
              <Text style={{ fontSize: 13, color: "#71717A", fontStyle: "italic" }}>
                {tutorName} is typing...
              </Text>
            </View>
          )}

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
                      onChangeText={handleTypingChange}
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
  attachmentCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 200,
    maxWidth: 270,
    paddingVertical: 4,
  },
  attachmentBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pdfIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    paddingRight: 4,
  },
  attachmentNameText: {
    fontFamily: fonts.rubik,
    fontSize: 13,
    fontWeight: "600",
  },
  attachmentSizeText: {
    fontFamily: fonts.rubik,
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  downloadIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },
  userDownloadBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  downloadArrowText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
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
  callCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 210,
    maxWidth: 280,
    paddingVertical: 4,
  },
  callIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  callIconMissed: {
    backgroundColor: "#FEE2E2",
  },
  callIconUser: {
    backgroundColor: "rgba(255, 255, 255, 0.22)",
  },
  callIconOther: {
    backgroundColor: "#E6F4F1",
  },
  callDetailsCol: {
    flex: 1,
    paddingRight: 4,
  },
  callTitleText: {
    fontFamily: fonts?.rubikBold || "System",
    fontSize: 14.5,
    fontWeight: "700",
    marginBottom: 2,
  },
  callSubRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  callSubText: {
    fontFamily: fonts?.rubik || "System",
    fontSize: 12,
  },
  callActionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },
  userCallActionBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
});
