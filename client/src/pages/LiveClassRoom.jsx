import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../socket";

const ICE_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const REACTIONS = ["👍", "❤️", "😂", "🎉", "🔥", "👏"];

// ─── small helpers ────────────────────────────────────────────────────────────
function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function Avatar({ name = "?" }) {
  const cols = [
    "bg-violet-500",
    "bg-blue-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-pink-500",
    "bg-indigo-500",
  ];
  return (
    <div
      className={`w-7 h-7 rounded-full ${cols[name.charCodeAt(0) % cols.length]}
                  flex items-center justify-center text-white font-black text-[10px]
                  shrink-0 select-none`}
    >
      {name[0].toUpperCase()}
    </div>
  );
}

// Reusable toolbar icon-button
function CtrlBtn({
  onClick,
  active,
  danger,
  disabled,
  title,
  label,
  children,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl
                  text-[10px] font-bold transition-all cursor-pointer
                  active:scale-95 min-w-[52px]
                  disabled:opacity-40 disabled:cursor-not-allowed
                  ${
                    danger
                      ? "bg-red-500/20 text-red-400 border border-red-500/25 hover:bg-red-500/30"
                      : active
                        ? "bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30"
                        : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white"
                  }`}
    >
      <span className="text-lg leading-tight">{children}</span>
      <span className="leading-none">{label}</span>
    </button>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function LiveClassRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTeacher = user.role === "teacher";
  const socket = getSocket(user.id);

  // ── class / chat data ───────────────────────────────────────────────────────
  const [liveClass, setLiveClass] = useState(null);
  const [comments, setComments] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [panelTab, setPanelTab] = useState("chat");
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState(null); // { id, userName }
  const [questionText, setQuestionText] = useState("");
  const chatEndRef = useRef(null);

  // ── room presence ───────────────────────────────────────────────────────────
  const [reactions, setReactions] = useState([]); // { id, emoji, name, x }
  const [raisedHands, setRaisedHands] = useState({}); // userId → name
  const [participantCount, setParticipantCount] = useState(0);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showReactPicker, setShowReactPicker] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  // ── media flags ─────────────────────────────────────────────────────────────
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  // student-side: what the teacher is currently broadcasting
  const [teacherHasScreen, setTeacherHasScreen] = useState(false);
  const [streamActive, setStreamActive] = useState(false);

  // ── recording ───────────────────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [uploadingRec, setUploadingRec] = useState(false);
  const [recDone, setRecDone] = useState(false);

  // ── media stream refs ───────────────────────────────────────────────────────
  const cameraStreamRef = useRef(null); // teacher: getUserMedia stream
  const screenStreamRef = useRef(null); // teacher: getDisplayMedia stream
  const studentMicRef = useRef(null); // student: mic-only getUserMedia stream
  // When teacher's screen track arrives before remoteScreenRef DOM node exists,
  // we hold the MediaStream here and mount it in a useEffect.
  const pendingScreenRef = useRef(null);

  // ── WebRTC refs ─────────────────────────────────────────────────────────────
  // Teacher keeps one RTCPeerConnection per viewer
  const peerConnsRef = useRef(new Map()); // viewerSocketId → PC
  const screenSendersRef = useRef(new Map()); // viewerSocketId → RTCRtpSender for screen track
  // Student keeps one RTCPeerConnection to teacher
  const peerConnRef = useRef(null);
  const makingOfferRef = useRef(false); // guard against simultaneous renegotiations

  // ── video element refs ──────────────────────────────────────────────────────
  const localCameraRef = useRef(null); // teacher: camera <video>
  const localScreenRef = useRef(null); // teacher: screen <video>
  const remoteCameraRef = useRef(null); // student: teacher's camera <video>
  const remoteScreenRef = useRef(null); // student: teacher's screen <video>

  // ── recording refs ──────────────────────────────────────────────────────────
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  // ─── data fetch ──────────────────────────────────────────────────────────────
  const loadClass = useCallback(async () => {
    const res = await fetch(`/api/live-classes/${id}`);
    const data = await res.json();
    if (!data.error) {
      setLiveClass(data);
      setParticipantCount(data.attendeeCount ?? 0);
    }
  }, [id]);

  const loadComments = useCallback(async () => {
    const data = await fetch(`/api/live-classes/${id}/comments`).then((r) =>
      r.json(),
    );
    if (Array.isArray(data)) setComments(data);
  }, [id]);

  const loadQuestions = useCallback(async () => {
    const data = await fetch(`/api/live-classes/${id}/questions`).then((r) =>
      r.json(),
    );
    if (Array.isArray(data)) setQuestions(data);
  }, [id]);

  // ─── teacher: WebRTC peer connection per viewer ───────────────────────────
  const makePeerForViewer = useCallback(
    (viewerSocketId) => {
      const pc = new RTCPeerConnection(ICE_CONFIG);

      // Add camera stream tracks if camera is running
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => {
          if (t.kind === "video") t.contentHint = "motion";
          pc.addTrack(t, cameraStreamRef.current);
        });
      }
      // Add screen track if screen share is already active
      if (screenStreamRef.current) {
        const st = screenStreamRef.current.getVideoTracks()[0];
        if (st) {
          st.contentHint = "detail";
          const sender = pc.addTrack(st, screenStreamRef.current);
          screenSendersRef.current.set(viewerSocketId, sender);
        }
      }

      pc.onicecandidate = ({ candidate }) => {
        if (candidate)
          socket.emit("ice-candidate", { to: viewerSocketId, candidate });
      };

      // Renegotiation: fires when tracks are added/removed later
      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("offer", { to: viewerSocketId, offer, liveClassId: id });
        } catch (e) {
          console.error("teacher renegotiation error:", e);
        }
      };

      // Teacher hears students who enabled their mic
      pc.ontrack = ({ track }) => {
        if (track.kind === "audio") {
          const el = new Audio();
          el.srcObject = new MediaStream([track]);
          el.play().catch(() => {});
        }
      };

      peerConnsRef.current.set(viewerSocketId, pc);
      return pc;
    },
    [id, socket],
  );

  // ─── teacher: start camera + mic ─────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" },
        audio: true,
      });
      stream.getVideoTracks().forEach((t) => (t.contentHint = "motion"));
      cameraStreamRef.current = stream;
      if (localCameraRef.current) localCameraRef.current.srcObject = stream;
      setCameraOn(true);
      setMicOn(true);

      // Register as broadcaster so students know teacher is live
      socket.emit("broadcaster", { liveClassId: id });

      // Add tracks to any peers already waiting (late-start case)
      peerConnsRef.current.forEach((pc) => {
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      });
    } catch (e) {
      console.error("Camera start error:", e);
    }
  }, [id, socket]);

  // ─── teacher: mic toggle ─────────────────────────────────────────────────
  const toggleTeacherMic = useCallback(() => {
    const track = cameraStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  }, []);

  // ─── teacher: camera toggle ──────────────────────────────────────────────
  const toggleTeacherCamera = useCallback(() => {
    const track = cameraStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCameraOn(track.enabled);
  }, []);

  // ─── teacher: screen share ───────────────────────────────────────────────
  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30, cursor: "always" },
        audio: true,
      });
      const st = stream.getVideoTracks()[0];
      st.contentHint = "detail";
      screenStreamRef.current = stream;
      if (localScreenRef.current) localScreenRef.current.srcObject = stream;
      setScreenSharing(true);

      // Add screen track to all existing peer connections
      peerConnsRef.current.forEach((pc, vid) => {
        const sender = pc.addTrack(st, stream);
        screenSendersRef.current.set(vid, sender);
        // onnegotiationneeded fires automatically → new offer sent
      });

      socket.emit("screen-share-started", { liveClassId: id });

      // Handle "Stop sharing" from browser chrome
      st.onended = stopScreenShare;
    } catch {
      /* user cancelled */
    }
  }, [id, socket]);

  const stopScreenShare = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    if (localScreenRef.current) localScreenRef.current.srcObject = null;

    // Remove screen senders from all peer connections (triggers renegotiation)
    screenSendersRef.current.forEach((sender, vid) => {
      const pc = peerConnsRef.current.get(vid);
      try {
        pc?.removeTrack(sender);
      } catch (_) {}
    });
    screenSendersRef.current.clear();

    socket.emit("screen-share-stopped", { liveClassId: id });
    setScreenSharing(false);
  }, [id, socket]);

  // ─── teacher: recording ──────────────────────────────────────────────────
  const startRecording = useCallback(() => {
    const stream = screenStreamRef.current || cameraStreamRef.current;
    if (!stream) return;
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const rec = new MediaRecorder(stream, { mimeType });
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.start(1000);
    recorderRef.current = rec;
    setIsRecording(true);
  }, []);

  const stopAndUpload = useCallback(() => {
    if (!recorderRef.current) return;
    recorderRef.current.stop();
    setIsRecording(false);
    recorderRef.current.onstop = async () => {
      setUploadingRec(true);
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const form = new FormData();
      form.append("recording", blob, "recording.webm");
      form.append("teacherId", user.id);
      try {
        const res = await fetch(`/api/live-classes/${id}/recording`, {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        if (data.recordingUrl) {
          setLiveClass((p) => p && { ...p, recordingUrl: data.recordingUrl });
          setRecDone(true);
        }
      } finally {
        setUploadingRec(false);
      }
    };
  }, [id, user.id]);

  // ─── teacher: end class ──────────────────────────────────────────────────
  const endClass = useCallback(async () => {
    socket.emit("end-class", { liveClassId: id });
    await fetch(`/api/live-classes/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ended", teacherId: user.id }),
    });
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerConnsRef.current.forEach((pc) => pc.close());
    socket.emit("broadcaster-stop", { liveClassId: id });
    navigate(-1);
  }, [id, socket, user.id, navigate]);

  // ─── student: mic toggle ─────────────────────────────────────────────────
  const toggleStudentMic = useCallback(async () => {
    if (micOn) {
      studentMicRef.current?.getTracks().forEach((t) => t.stop());
      studentMicRef.current = null;
      setMicOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        studentMicRef.current = stream;
        const track = stream.getAudioTracks()[0];
        if (peerConnRef.current) {
          peerConnRef.current.addTrack(track, stream);
          // onnegotiationneeded fires → student sends offer to teacher
        }
        setMicOn(true);
      } catch (e) {
        console.error("Mic error:", e);
      }
    }
  }, [micOn]);

  // ─── student: raise/lower hand ───────────────────────────────────────────
  const toggleHand = useCallback(() => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    socket.emit(next ? "raise-hand" : "lower-hand", {
      liveClassId: id,
      userId: user.id,
      userName: user.name,
    });
  }, [isHandRaised, id, socket, user]);

  // ─── reactions ───────────────────────────────────────────────────────────
  const sendReaction = useCallback(
    (emoji) => {
      socket.emit("send-reaction", {
        liveClassId: id,
        emoji,
        userName: user.name,
      });
      setShowReactPicker(false);
    },
    [id, socket, user.name],
  );

  const showReaction = useCallback((emoji, name) => {
    const rid = `${Date.now()}-${Math.random()}`;
    setReactions((p) => [
      ...p,
      { id: rid, emoji, name, x: Math.random() * 60 + 20 },
    ]);
    setTimeout(() => setReactions((p) => p.filter((r) => r.id !== rid)), 3000);
  }, []);

  // ─── chat ────────────────────────────────────────────────────────────────
  const postComment = useCallback(
    async (e) => {
      e.preventDefault();
      if (!commentText.trim()) return;
      await fetch(`/api/live-classes/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          text: commentText.trim(),
          parentComment: replyTo?.id || null,
        }),
      });
      setCommentText("");
      setReplyTo(null);
    },
    [id, user.id, commentText, replyTo],
  );

  const postQuestion = useCallback(
    async (e) => {
      e.preventDefault();
      if (!questionText.trim()) return;
      await fetch(`/api/live-classes/${id}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: user.id,
          question: questionText.trim(),
        }),
      });
      setQuestionText("");
    },
    [id, user.id, questionText],
  );

  const markAnswered = useCallback(
    async (qId) => {
      await fetch(`/api/live-classes/${id}/questions/${qId}/answer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: user.id }),
      });
    },
    [id, user.id],
  );

  // Mount pending screen stream once remoteScreenRef is available
  useEffect(() => {
    if (
      teacherHasScreen &&
      remoteScreenRef.current &&
      pendingScreenRef.current
    ) {
      remoteScreenRef.current.srcObject = pendingScreenRef.current;
    }
  }, [teacherHasScreen]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  // ─── socket + WebRTC setup ───────────────────────────────────────────────
  useEffect(() => {
    loadClass();
    loadComments();
    loadQuestions();

    socket.emit("join-liveclass", id);
    fetch(`/api/live-classes/${id}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    if (!isTeacher) socket.emit("viewer", { liveClassId: id });

    // ── chat/Q&A ──────────────────────────────────────────────────────────
    const onNewComment = (c) => setComments((p) => [...p, c]);
    const onNewReply = (r) => setComments((p) => [...p, r]);
    const onNewQuestion = (q) => setQuestions((p) => [...p, q]);
    const onQAnswered = ({ questionId }) =>
      setQuestions((p) =>
        p.map((q) => (q.id === questionId ? { ...q, isAnswered: true } : q)),
      );

    // ── reactions / hands ─────────────────────────────────────────────────
    const onReaction = ({ emoji, userName }) => showReaction(emoji, userName);
    const onHandRaised = ({ userId, userName }) =>
      setRaisedHands((p) => ({ ...p, [userId]: userName }));
    const onHandLowered = ({ userId }) =>
      setRaisedHands((p) => {
        const n = { ...p };
        delete n[userId];
        return n;
      });

    // ── room status ───────────────────────────────────────────────────────
    const onStatus = ({ status }) => setLiveClass((p) => p && { ...p, status });
    const onParticipant = ({ attendeeCount }) =>
      setParticipantCount(attendeeCount);
    const onClassEnded = () => navigate(-1);

    // ── student: receive offer from teacher ───────────────────────────────
    const getOrCreateStudentPC = (fromSocketId) => {
      if (peerConnRef.current) return peerConnRef.current;

      const pc = new RTCPeerConnection(ICE_CONFIG);
      peerConnRef.current = pc;

      pc.ontrack = ({ track }) => {
        if (track.kind === "audio") {
          // Add teacher audio to the camera video element
          const s = remoteCameraRef.current?.srcObject || new MediaStream();
          s.addTrack(track);
          if (remoteCameraRef.current) remoteCameraRef.current.srcObject = s;
          return;
        }
        if (track.contentHint === "detail") {
          // Screen share track
          const stream = new MediaStream([track]);
          pendingScreenRef.current = stream;
          setTeacherHasScreen(true);
          setStreamActive(true);
          track.onended = () => {
            setTeacherHasScreen(false);
            pendingScreenRef.current = null;
          };
        } else {
          // Camera track
          const s = remoteCameraRef.current?.srcObject || new MediaStream();
          s.addTrack(track);
          if (remoteCameraRef.current) remoteCameraRef.current.srcObject = s;
          setStreamActive(true);
        }
      };

      pc.onicecandidate = ({ candidate }) => {
        if (candidate)
          socket.emit("ice-candidate", { to: fromSocketId, candidate });
      };

      // Student mic renegotiation
      pc.onnegotiationneeded = async () => {
        if (makingOfferRef.current) return;
        makingOfferRef.current = true;
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("student-offer", { liveClassId: id, offer });
        } catch (e) {
          console.error("student renegotiation:", e);
        } finally {
          makingOfferRef.current = false;
        }
      };

      return pc;
    };

    const onOffer = async ({ from, offer }) => {
      const pc = getOrCreateStudentPC(from);
      // Update ICE target to the latest teacher socket (reconnect case)
      pc.onicecandidate = ({ candidate }) => {
        if (candidate) socket.emit("ice-candidate", { to: from, candidate });
      };
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { to: from, answer, liveClassId: id });
    };

    // ── teacher: receive answer from viewer ───────────────────────────────
    const onAnswer = async ({ from, answer }) => {
      const pc = peerConnsRef.current.get(from);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    };

    // ── teacher: new viewer joined ────────────────────────────────────────
    const onNewViewer = async ({ viewerSocketId }) => {
      if (!isTeacher) return;
      const pc = makePeerForViewer(viewerSocketId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { to: viewerSocketId, offer, liveClassId: id });
    };

    // ── teacher: student's mic renegotiation offer ────────────────────────
    const onStudentOffer = async ({ from, offer }) => {
      if (!isTeacher) return;
      const pc = peerConnsRef.current.get(from);
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("teacher-reanswer", { to: from, answer });
    };

    // ── student: teacher's answer for mic ─────────────────────────────────
    const onTeacherReanswer = async ({ answer }) => {
      if (peerConnRef.current)
        await peerConnRef.current.setRemoteDescription(
          new RTCSessionDescription(answer),
        );
    };

    // ── ICE candidates ────────────────────────────────────────────────────
    const onIce = async ({ from, candidate }) => {
      try {
        const pc = isTeacher
          ? peerConnsRef.current.get(from)
          : peerConnRef.current;
        if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (_) {}
    };

    const onBroadcasterReady = () => {
      if (!isTeacher) socket.emit("viewer", { liveClassId: id });
    };
    const onBroadcasterLeft = () => {
      setStreamActive(false);
      setTeacherHasScreen(false);
      if (remoteCameraRef.current) remoteCameraRef.current.srcObject = null;
      peerConnRef.current?.close();
      peerConnRef.current = null;
    };

    const onScreenStarted = () => setTeacherHasScreen(true);
    const onScreenStopped = () => {
      setTeacherHasScreen(false);
      if (remoteScreenRef.current) remoteScreenRef.current.srcObject = null;
      pendingScreenRef.current = null;
    };
    const onRecordingAvailable = ({ recordingUrl }) =>
      setLiveClass((p) => p && { ...p, recordingUrl });

    socket.on("new-comment", onNewComment);
    socket.on("new-reply", onNewReply);
    socket.on("new-question", onNewQuestion);
    socket.on("question-answered", onQAnswered);
    socket.on("reaction", onReaction);
    socket.on("hand-raised", onHandRaised);
    socket.on("hand-lowered", onHandLowered);
    socket.on("live-class-status", onStatus);
    socket.on("participant-joined", onParticipant);
    socket.on("class-ended", onClassEnded);
    socket.on("broadcaster-ready", onBroadcasterReady);
    socket.on("offer", onOffer);
    socket.on("new-viewer", onNewViewer);
    socket.on("answer", onAnswer);
    socket.on("student-offer", onStudentOffer);
    socket.on("teacher-reanswer", onTeacherReanswer);
    socket.on("ice-candidate", onIce);
    socket.on("broadcaster-left", onBroadcasterLeft);
    socket.on("screen-share-started", onScreenStarted);
    socket.on("screen-share-stopped", onScreenStopped);
    socket.on("recording-available", onRecordingAvailable);

    return () => {
      socket.emit("leave-liveclass", id);
      if (isTeacher) {
        cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
        screenStreamRef.current?.getTracks().forEach((t) => t.stop());
        peerConnsRef.current.forEach((pc) => pc.close());
        socket.emit("broadcaster-stop", { liveClassId: id });
      } else {
        studentMicRef.current?.getTracks().forEach((t) => t.stop());
        peerConnRef.current?.close();
      }
      [
        ["new-comment", onNewComment],
        ["new-reply", onNewReply],
        ["new-question", onNewQuestion],
        ["question-answered", onQAnswered],
        ["reaction", onReaction],
        ["hand-raised", onHandRaised],
        ["hand-lowered", onHandLowered],
        ["live-class-status", onStatus],
        ["participant-joined", onParticipant],
        ["class-ended", onClassEnded],
        ["broadcaster-ready", onBroadcasterReady],
        ["offer", onOffer],
        ["new-viewer", onNewViewer],
        ["answer", onAnswer],
        ["student-offer", onStudentOffer],
        ["teacher-reanswer", onTeacherReanswer],
        ["ice-candidate", onIce],
        ["broadcaster-left", onBroadcasterLeft],
        ["screen-share-started", onScreenStarted],
        ["screen-share-stopped", onScreenStopped],
        ["recording-available", onRecordingAvailable],
      ].forEach(([ev, fn]) => socket.off(ev, fn));
    };
  }, [id, isTeacher]);

  // ─── derived ─────────────────────────────────────────────────────────────
  const topLevel = comments.filter((c) => !c.parentComment);
  const getReplies = (cid) =>
    comments.filter(
      (c) => c.parentComment === cid || c.parentComment?.toString() === cid,
    );
  const handCount = Object.keys(raisedHands).length;

  // PiP is shown when teacher has both camera and screen active
  const showPiP = isTeacher
    ? screenSharing && cameraStreamRef.current
    : teacherHasScreen;

  if (!liveClass) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl glass border border-[var(--border)]/30 flex items-center justify-center mx-auto mb-3 animate-pulse">
            <span className="text-xl">📡</span>
          </div>
          <p className="text-sm text-[var(--muted)] font-semibold">
            Loading class…
          </p>
        </div>
      </div>
    );
  }

  const isLive = liveClass.status === "live";
  const isEnded = liveClass.status === "ended";

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      {/* Reaction floating animation */}
      <style>{`
        @keyframes floatUp {
          0%   { opacity: 1; transform: translateY(0) scale(1); }
          70%  { opacity: 0.9; transform: translateY(-55px) scale(1.25); }
          100% { opacity: 0; transform: translateY(-80px) scale(0.8); }
        }
        .reaction-float { animation: floatUp 3s ease-out forwards; }
      `}</style>

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]/20 glass-heavy shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-xl glass border border-[var(--border)]/20 flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            ←
          </button>
          <div>
            <h1 className="text-sm font-bold text-[var(--text)] leading-tight">
              {liveClass.title}
            </h1>
            <p className="text-[11px] text-[var(--muted)]">
              {isTeacher ? "You are hosting" : "Joined as student"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[var(--border)]/10 text-[var(--muted)] border border-[var(--border)]/15">
            👥 {participantCount}
          </span>
          {handCount > 0 && (
            <button
              onClick={() => setPanelTab("people")}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-500/12 text-amber-400 border border-amber-500/20 cursor-pointer hover:bg-amber-500/18 transition-colors"
            >
              ✋ {handCount}
            </button>
          )}
          {isLive && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-black bg-red-500/12 text-red-400 border border-red-500/20 uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />{" "}
              Live
            </span>
          )}
          {isEnded && (
            <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[var(--border)]/10 text-[var(--muted)] border border-[var(--border)]/15">
              Ended
            </span>
          )}
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ═══ VIDEO PANEL ══════════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col bg-black relative min-w-0">
          {/* Video area */}
          <div className="flex-1 relative overflow-hidden">
            {/* ── Teacher: main screen view ── */}
            {isTeacher && (
              <video
                ref={localScreenRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-contain ${!screenSharing ? "hidden" : ""}`}
              />
            )}

            {/* ── Teacher: camera (main when not sharing, PiP when sharing) ── */}
            {isTeacher && (
              <video
                ref={localCameraRef}
                autoPlay
                muted
                playsInline
                className={`object-cover transition-all ${
                  showPiP
                    ? "absolute bottom-4 right-4 w-44 h-32 rounded-2xl border-2 border-white/20 z-20 shadow-xl"
                    : "w-full h-full object-contain"
                } ${!cameraOn && !screenSharing ? "opacity-0" : ""}`}
              />
            )}

            {/* ── Student: teacher's screen (main) ── */}
            {!isTeacher && teacherHasScreen && (
              <video
                ref={remoteScreenRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            )}

            {/* ── Student: teacher's camera (main or PiP) ── */}
            {!isTeacher && (
              <video
                ref={remoteCameraRef}
                autoPlay
                playsInline
                className={`object-cover ${
                  showPiP
                    ? "absolute bottom-4 right-4 w-44 h-32 rounded-2xl border-2 border-white/20 z-20 shadow-xl"
                    : "w-full h-full object-contain"
                }`}
              />
            )}

            {/* ── Floating reactions ── */}
            {reactions.map((r) => (
              <div
                key={r.id}
                className="reaction-float pointer-events-none select-none absolute z-30 text-center"
                style={{ left: `${r.x}%`, bottom: "80px" }}
              >
                <div style={{ fontSize: "2rem" }}>{r.emoji}</div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    fontSize: "10px",
                    fontWeight: 700,
                    textShadow: "0 1px 4px rgba(0,0,0,0.5)",
                  }}
                >
                  {r.name}
                </div>
              </div>
            ))}

            {/* ── Teacher: no stream placeholder ── */}
            {isTeacher && !cameraStreamRef.current && !screenSharing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
                <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl">
                  👤
                </div>
                <p className="text-white/50 font-semibold text-sm">
                  Click{" "}
                  <span className="font-bold text-white/70">
                    📷 Start Camera
                  </span>{" "}
                  to go live
                </p>
              </div>
            )}

            {/* ── Teacher: camera off overlay ── */}
            {isTeacher &&
              cameraStreamRef.current &&
              !cameraOn &&
              !screenSharing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 z-10">
                  <div className="w-16 h-16 rounded-full bg-white/8 flex items-center justify-center text-3xl">
                    📵
                  </div>
                  <p className="text-white/50 text-sm font-medium">
                    Camera is off
                  </p>
                </div>
              )}

            {/* ── Student: no stream placeholder ── */}
            {!isTeacher && !streamActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
                <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl">
                  {isEnded ? "📼" : "📡"}
                </div>
                <p className="text-white/50 font-bold text-base">
                  {isEnded
                    ? "This class has ended"
                    : isLive
                      ? "Waiting for teacher to start camera…"
                      : "Class hasn't started yet"}
                </p>
                {liveClass.recordingUrl && (
                  <a
                    href={liveClass.recordingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/25 text-sm font-bold hover:bg-violet-500/30 transition-colors"
                  >
                    ▶ Watch Recording
                  </a>
                )}
              </div>
            )}
          </div>

          {/* ═══ Toolbar ══════════════════════════════════════════════════════ */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/80 border-t border-white/8 shrink-0 gap-2 flex-wrap">
            {/* Left: media controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {isTeacher ? (
                <>
                  {!cameraStreamRef.current ? (
                    <CtrlBtn
                      onClick={startCamera}
                      label="Camera"
                      disabled={isEnded}
                    >
                      📷
                    </CtrlBtn>
                  ) : (
                    <>
                      <CtrlBtn
                        onClick={toggleTeacherMic}
                        active={micOn}
                        label={micOn ? "Mute" : "Unmute"}
                      >
                        {micOn ? "🎤" : "🔇"}
                      </CtrlBtn>
                      <CtrlBtn
                        onClick={toggleTeacherCamera}
                        active={cameraOn}
                        label={cameraOn ? "Cam Off" : "Cam On"}
                      >
                        {cameraOn ? "📷" : "📵"}
                      </CtrlBtn>
                    </>
                  )}

                  <CtrlBtn
                    onClick={screenSharing ? stopScreenShare : startScreenShare}
                    active={screenSharing}
                    disabled={isEnded}
                    label={screenSharing ? "Stop" : "Screen"}
                  >
                    {screenSharing ? "🖥️" : "📺"}
                  </CtrlBtn>

                  {(cameraStreamRef.current || screenStreamRef.current) &&
                    (isRecording ? (
                      <CtrlBtn onClick={stopAndUpload} active label="Stop Rec">
                        ⏹️
                      </CtrlBtn>
                    ) : (
                      <CtrlBtn
                        onClick={startRecording}
                        disabled={recDone}
                        label={recDone ? "Saved ✓" : "Record"}
                      >
                        {recDone ? "✅" : "⏺️"}
                      </CtrlBtn>
                    ))}

                  {uploadingRec && (
                    <span className="text-[10px] text-amber-400 font-bold animate-pulse">
                      Uploading…
                    </span>
                  )}
                </>
              ) : (
                <>
                  <CtrlBtn
                    onClick={toggleStudentMic}
                    active={micOn}
                    label={micOn ? "Mute" : "Speak"}
                  >
                    {micOn ? "🎤" : "🔇"}
                  </CtrlBtn>
                  <CtrlBtn
                    onClick={toggleHand}
                    active={isHandRaised}
                    label={isHandRaised ? "Lower" : "Hand"}
                  >
                    ✋
                  </CtrlBtn>
                </>
              )}

              {/* Emoji reactions (everyone) */}
              <div className="relative">
                <CtrlBtn
                  onClick={() => setShowReactPicker((p) => !p)}
                  label="React"
                >
                  😊
                </CtrlBtn>
                {showReactPicker && (
                  <div className="absolute bottom-full left-0 mb-2 flex gap-1.5 p-2 rounded-xl bg-black/90 border border-white/10 shadow-xl z-50">
                    {REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => sendReaction(emoji)}
                        className="text-2xl hover:scale-125 transition-transform cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: leave / end */}
            <div>
              {isTeacher ? (
                confirmEnd ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-white/50">
                      End class for everyone?
                    </span>
                    <button
                      onClick={endClass}
                      className="px-3 py-1.5 rounded-xl bg-red-500 text-white text-xs font-bold cursor-pointer hover:bg-red-600 active:scale-95 transition-all"
                    >
                      Yes, End
                    </button>
                    <button
                      onClick={() => setConfirmEnd(false)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 text-white/70 text-xs font-bold cursor-pointer hover:bg-white/15 active:scale-95 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <CtrlBtn
                    danger
                    onClick={() => setConfirmEnd(true)}
                    label="End Class"
                  >
                    ⬛
                  </CtrlBtn>
                )
              ) : (
                <CtrlBtn danger onClick={() => navigate(-1)} label="Leave">
                  🚪
                </CtrlBtn>
              )}
            </div>
          </div>
        </div>

        {/* ═══ SIDEBAR PANEL ════════════════════════════════════════════════════ */}
        <aside className="w-80 flex flex-col border-l border-[var(--border)]/20 glass-heavy shrink-0">
          {/* Tabs */}
          <div className="flex border-b border-[var(--border)]/20 shrink-0">
            {[
              { key: "chat", label: "💬 Chat", badge: comments.length },
              {
                key: "qa",
                label: "❓ Q&A",
                badge: questions.filter((q) => !q.isAnswered).length,
              },
              { key: "people", label: "👥 People", badge: handCount || null },
            ].map(({ key, label, badge }) => (
              <button
                key={key}
                onClick={() => setPanelTab(key)}
                className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wide transition-colors cursor-pointer
                            ${
                              panelTab === key
                                ? "text-[var(--accent)] border-b-2 border-[var(--accent)]"
                                : "text-[var(--muted)] hover:text-[var(--text)]"
                            }`}
              >
                {label}
                {badge > 0 && (
                  <span className="ml-1 text-[9px] font-black opacity-60">
                    ({badge})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Chat ── */}
          {panelTab === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                {topLevel.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-2 opacity-40">
                    <span className="text-3xl">💬</span>
                    <p className="text-xs text-[var(--muted)]">
                      No messages yet
                    </p>
                  </div>
                )}
                {topLevel.map((c) => {
                  const replies = getReplies(c.id);
                  return (
                    <div key={c.id}>
                      <div className="flex gap-2">
                        <Avatar name={c.user?.name || "?"} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-1.5 mb-0.5 flex-wrap">
                            <span className="text-[12px] font-bold text-[var(--text)]">
                              {c.user?.name}
                            </span>
                            {c.isTeacherReply && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/20">
                                Teacher
                              </span>
                            )}
                            <span className="text-[10px] text-[var(--muted)]/50">
                              {timeAgo(c.createdAt)}
                            </span>
                          </div>
                          <p className="text-[13px] text-[var(--text)]/85 leading-snug break-words">
                            {c.text}
                          </p>
                          <button
                            onClick={() =>
                              setReplyTo(
                                replyTo?.id === c.id
                                  ? null
                                  : { id: c.id, userName: c.user?.name },
                              )
                            }
                            className="mt-1 text-[10px] font-bold text-[var(--muted)]/50 hover:text-[var(--accent)] transition-colors cursor-pointer"
                          >
                            ↩ Reply
                          </button>
                        </div>
                      </div>
                      {replies.length > 0 && (
                        <div className="ml-9 mt-2 pl-3 border-l-2 border-[var(--accent)]/20 space-y-2">
                          {replies.map((r) => (
                            <div key={r.id} className="flex gap-2">
                              <Avatar name={r.user?.name || "?"} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-1.5 mb-0.5 flex-wrap">
                                  <span className="text-[11px] font-bold text-[var(--text)]">
                                    {r.user?.name}
                                  </span>
                                  {r.isTeacherReply && (
                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/20">
                                      Teacher
                                    </span>
                                  )}
                                  <span className="text-[10px] text-[var(--muted)]/50">
                                    {timeAgo(r.createdAt)}
                                  </span>
                                </div>
                                <p className="text-[12px] text-[var(--text)]/80 leading-snug break-words">
                                  {r.text}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {replyTo && (
                <div className="mx-3 mb-1 flex items-center justify-between px-3 py-1.5 rounded-xl bg-[var(--accent)]/8 border border-[var(--accent)]/15 text-[11px]">
                  <span className="text-[var(--muted)]">
                    Replying to{" "}
                    <span className="font-bold text-[var(--accent)]">
                      {replyTo.userName}
                    </span>
                  </span>
                  <button
                    onClick={() => setReplyTo(null)}
                    className="text-[var(--muted)] hover:text-[var(--text)] cursor-pointer text-base leading-none"
                  >
                    ×
                  </button>
                </div>
              )}

              <form
                onSubmit={postComment}
                className="p-3 border-t border-[var(--border)]/15 flex gap-2 shrink-0"
              >
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={
                    replyTo
                      ? `Reply to ${replyTo.userName}…`
                      : "Send a message…"
                  }
                  className="flex-1 px-3 py-2 rounded-xl text-sm outline-none border border-[var(--border)]/30 focus:border-[var(--accent)] glass-heavy text-[var(--text)] placeholder:text-[var(--muted)]/40 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] disabled:opacity-40 cursor-pointer shrink-0"
                >
                  ↑
                </button>
              </form>
            </>
          )}

          {/* ── Q&A ── */}
          {panelTab === "qa" && (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0">
                {questions.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-2 opacity-40">
                    <span className="text-3xl">❓</span>
                    <p className="text-xs text-[var(--muted)]">
                      No questions yet
                    </p>
                  </div>
                )}
                {questions.map((q) => (
                  <div
                    key={q.id}
                    className={`p-3 rounded-2xl border ${
                      q.isAnswered
                        ? "bg-emerald-500/6 border-emerald-500/15"
                        : "bg-[var(--border)]/6 border-[var(--border)]/15"
                    }`}
                  >
                    <div className="flex gap-2">
                      <Avatar name={q.student?.name || "?"} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span className="text-[12px] font-bold text-[var(--text)]">
                            {q.student?.name}
                          </span>
                          {q.isAnswered && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                              Answered
                            </span>
                          )}
                        </div>
                        <p className="text-[13px] text-[var(--text)]/85 leading-snug break-words">
                          {q.question}
                        </p>
                      </div>
                    </div>
                    {isTeacher && !q.isAnswered && (
                      <div className="flex gap-3 mt-2 ml-9">
                        <button
                          onClick={() => markAnswered(q.id)}
                          className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer transition-colors"
                        >
                          ✓ Mark answered
                        </button>
                        <button
                          onClick={() => {
                            setPanelTab("chat");
                            setCommentText(`@${q.student?.name} `);
                          }}
                          className="text-[11px] font-bold text-[var(--muted)]/60 hover:text-[var(--accent)] cursor-pointer transition-colors"
                        >
                          ↩ Reply in chat
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {!isTeacher && (
                <form
                  onSubmit={postQuestion}
                  className="p-3 border-t border-[var(--border)]/15 flex gap-2 shrink-0"
                >
                  <input
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Ask a question…"
                    className="flex-1 px-3 py-2 rounded-xl text-sm outline-none border border-[var(--border)]/30 focus:border-[var(--accent)] glass-heavy text-[var(--text)] placeholder:text-[var(--muted)]/40 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!questionText.trim()}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] disabled:opacity-40 cursor-pointer shrink-0"
                  >
                    ↑
                  </button>
                </form>
              )}
            </>
          )}

          {/* ── People ── */}
          {panelTab === "people" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-5 min-h-0">
              {/* Host */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]/50 mb-2">
                  Host
                </p>
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--accent)]/6 border border-[var(--accent)]/15">
                  <Avatar name={liveClass.teacher?.name || "T"} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-[var(--text)] truncate">
                      {liveClass.teacher?.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {isTeacher && cameraOn && (
                        <span className="text-[10px] text-emerald-400 font-bold">
                          📷 on
                        </span>
                      )}
                      {isTeacher && micOn && (
                        <span className="text-[10px] text-emerald-400 font-bold">
                          🎤 on
                        </span>
                      )}
                      {isTeacher && screenSharing && (
                        <span className="text-[10px] text-blue-400 font-bold">
                          🖥️ sharing
                        </span>
                      )}
                      {isTeacher && isRecording && (
                        <span className="text-[10px] text-red-400 font-bold animate-pulse">
                          ⏺ rec
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Raised hands */}
              {handCount > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/70 mb-2">
                    ✋ Raised Hands ({handCount})
                  </p>
                  <div className="space-y-1.5">
                    {Object.entries(raisedHands).map(([uid, name]) => (
                      <div
                        key={uid}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/8 border border-amber-500/15"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar name={name} />
                          <span className="text-[12px] font-bold text-[var(--text)]">
                            {name}
                          </span>
                        </div>
                        {isTeacher && (
                          <button
                            onClick={() => {
                              socket.emit("lower-hand", {
                                liveClassId: id,
                                userId: uid,
                              });
                              setRaisedHands((p) => {
                                const n = { ...p };
                                delete n[uid];
                                return n;
                              });
                            }}
                            className="text-[10px] text-[var(--muted)] hover:text-red-400 cursor-pointer transition-colors font-bold"
                          >
                            Lower ↓
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Participant count */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]/50 mb-2">
                  Students · {participantCount}
                </p>
                <p className="text-[12px] text-[var(--muted)]/60 leading-relaxed">
                  {participantCount}{" "}
                  {participantCount === 1 ? "person has" : "people have"} joined
                  this session.
                </p>
                {liveClass.recordingUrl && (
                  <a
                    href={liveClass.recordingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[12px] font-bold hover:bg-violet-500/18 transition-colors"
                  >
                    ▶ Class Recording
                  </a>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
