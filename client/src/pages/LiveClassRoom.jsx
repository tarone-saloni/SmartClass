import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../socket";
import { apiFetch } from "../utils/api.js";

const ICE_CONFIG = {
  iceServers: (
    import.meta.env.VITE_STUN_SERVERS ||
    "stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302"
  )
    .split(",")
    .map((url) => ({ urls: url.trim() })),
};

const REACTIONS = ["👍", "❤️", "😂", "🎉", "🔥", "👏"];
const TILE_COLORS = [
  "bg-violet-600",
  "bg-blue-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-pink-600",
  "bg-indigo-600",
  "bg-teal-600",
];

function tileColor(name = "?") {
  return TILE_COLORS[(name.charCodeAt(0) || 0) % TILE_COLORS.length];
}
function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

// ── Participant tile (student camera or avatar) ────────────────────────────────
const ParticipantTile = memo(function ParticipantTile({
  stream,
  name,
  muted = false,
  label,
  isSmall = false,
  indicator,
}) {
  const videoRef = useRef(null);
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream ?? null;
  }, [stream]);

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-[#2a2a2e] border border-white/8 shrink-0
        ${isSmall ? "w-28 h-20" : "w-40 h-28"}`}
    >
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div
            className={`rounded-full ${tileColor(name)} flex items-center justify-center
              text-white font-black select-none
              ${isSmall ? "w-10 h-10 text-sm" : "w-14 h-14 text-xl"}`}
          >
            {name?.[0]?.toUpperCase() ?? "?"}
          </div>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-linear-to-t from-black/80 to-transparent">
        <span className="text-[11px] text-white font-semibold truncate block">
          {label ?? name}
        </span>
      </div>
      {indicator && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 rounded-full px-1.5 py-0.5">
          <span className="text-[10px]">{indicator}</span>
        </div>
      )}
    </div>
  );
});

// ── Control button (Google Meet style) ───────────────────────────────────────
function CtrlBtn({
  onClick,
  active,
  danger,
  disabled,
  title,
  label,
  children,
  wide,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex flex-col items-center gap-1 py-2.5 rounded-2xl text-[10px] font-black
        uppercase tracking-wide transition-all cursor-pointer active:scale-95 select-none
        disabled:opacity-40 disabled:cursor-not-allowed
        ${wide ? "px-5 min-w-18" : "px-3.5 min-w-14"}
        ${
          danger
            ? "bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/40"
            : active
              ? "bg-violet-500/30 text-violet-200 border border-violet-500/50 shadow-sm shadow-violet-500/10"
              : "bg-white/8 text-white/60 border border-white/10 hover:bg-white/15 hover:text-white"
        }`}
    >
      <span className="text-xl leading-none">{children}</span>
      <span className="leading-none mt-0.5 whitespace-nowrap">{label}</span>
    </button>
  );
}

// ─── Main classroom page ──────────────────────────────────────────────────────
export default function LiveClassRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTeacher = user.role === "teacher";
  const socket = getSocket(user.id);

  // ── class / chat state ──────────────────────────────────────────────────────
  const [liveClass, setLiveClass] = useState(null);
  const [comments, setComments] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [chatOpen, setChatOpen] = useState(true);
  const [panelTab, setPanelTab] = useState("chat");
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [questionText, setQuestionText] = useState("");
  const chatEndRef = useRef(null);

  // ── presence state ──────────────────────────────────────────────────────────
  const [reactions, setReactions] = useState([]);
  const [raisedHands, setRaisedHands] = useState({});
  const [participantCount, setParticipantCount] = useState(0);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showReactPicker, setShowReactPicker] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  // ── teacher media state ─────────────────────────────────────────────────────
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadingRec, setUploadingRec] = useState(false);
  const [recDone, setRecDone] = useState(false);

  // ── student media state ─────────────────────────────────────────────────────
  const [studentMicOn, setStudentMicOn] = useState(false);
  const [studentCamOn, setStudentCamOn] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const [teacherHasScreen, setTeacherHasScreen] = useState(false);

  // ── student tiles (teacher's view of all connected students) ────────────────
  // Map<viewerSocketId, { stream: MediaStream|null, userId, userName, camOn: bool }>
  const [studentTiles, setStudentTiles] = useState(new Map());

  // ── media stream refs ───────────────────────────────────────────────────────
  const cameraStreamRef = useRef(null); // teacher: getUserMedia stream
  const screenStreamRef = useRef(null); // teacher: getDisplayMedia stream
  const studentMicStreamRef = useRef(null); // student: mic stream
  const studentCamStreamRef = useRef(null); // student: camera stream
  const pendingScreenRef = useRef(null); // student: pending screen stream before mount

  // ── video element refs ──────────────────────────────────────────────────────
  const localCameraRef = useRef(null); // teacher: self camera preview
  const localScreenRef = useRef(null); // teacher: self screen preview
  const remoteCameraRef = useRef(null); // student: teacher's camera
  const remoteScreenRef = useRef(null); // student: teacher's screen
  const studentSelfVideoRef = useRef(null); // student: self camera preview

  // ── WebRTC refs ─────────────────────────────────────────────────────────────
  const peerConnsRef = useRef(new Map()); // teacher: viewerSocketId → RTCPeerConnection
  const screenSendersRef = useRef(new Map()); // teacher: viewerSocketId → screen RTCRtpSender
  const peerConnRef = useRef(null); // student: one PC to teacher
  const makingOfferRef = useRef(false);

  // ── recording refs ──────────────────────────────────────────────────────────
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  // ─── data fetch ───────────────────────────────────────────────────────────────
  const loadClass = useCallback(async () => {
    const res = await apiFetch(`/api/live-classes/${id}`);
    const data = await res.json();
    if (!data.error) {
      setLiveClass(data);
      setParticipantCount(data.attendeeCount ?? 0);
    }
  }, [id]);

  const loadComments = useCallback(async () => {
    const data = await apiFetch(`/api/live-classes/${id}/comments`).then((r) =>
      r.json(),
    );
    if (Array.isArray(data)) setComments(data);
  }, [id]);

  const loadQuestions = useCallback(async () => {
    const data = await apiFetch(`/api/live-classes/${id}/questions`).then((r) =>
      r.json(),
    );
    if (Array.isArray(data)) setQuestions(data);
  }, [id]);

  // ─── teacher: create one RTCPeerConnection per viewer ────────────────────────
  const makePeerForViewer = useCallback(
    (viewerSocketId) => {
      const pc = new RTCPeerConnection(ICE_CONFIG);

      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => {
          if (t.kind === "video") t.contentHint = "motion";
          pc.addTrack(t, cameraStreamRef.current);
        });
      }
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

      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("offer", { to: viewerSocketId, offer, liveClassId: id });
        } catch (e) {
          console.error("teacher renegotiation error:", e);
        }
      };

      // Teacher receives audio (student mic) and video (student camera) from students
      pc.ontrack = ({ track, streams }) => {
        if (track.kind === "audio") {
          const el = new Audio();
          el.srcObject = new MediaStream([track]);
          el.play().catch(() => {});
          return;
        }
        if (track.kind === "video") {
          const stream = streams[0] ?? new MediaStream([track]);
          setStudentTiles((prev) => {
            const next = new Map(prev);
            const existing = next.get(viewerSocketId) ?? {};
            next.set(viewerSocketId, { ...existing, stream, camOn: true });
            return next;
          });
          track.onended = () => {
            setStudentTiles((prev) => {
              const next = new Map(prev);
              const existing = next.get(viewerSocketId);
              if (existing)
                next.set(viewerSocketId, {
                  ...existing,
                  stream: null,
                  camOn: false,
                });
              return next;
            });
          };
        }
      };

      pc.onconnectionstatechange = () => {
        if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
          setStudentTiles((prev) => {
            const next = new Map(prev);
            next.delete(viewerSocketId);
            return next;
          });
          peerConnsRef.current.delete(viewerSocketId);
        }
      };

      peerConnsRef.current.set(viewerSocketId, pc);
      return pc;
    },
    [id, socket],
  );

  // ─── teacher: start camera + mic ──────────────────────────────────────────
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
      socket.emit("broadcaster", { liveClassId: id });
      peerConnsRef.current.forEach((pc) => {
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      });
    } catch (e) {
      console.error("Camera start error:", e);
    }
  }, [id, socket]);

  const toggleTeacherMic = useCallback(() => {
    const track = cameraStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  }, []);

  const toggleTeacherCamera = useCallback(() => {
    const track = cameraStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCameraOn(track.enabled);
  }, []);

  // ─── teacher: screen share ────────────────────────────────────────────────
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
      peerConnsRef.current.forEach((pc, vid) => {
        const sender = pc.addTrack(st, stream);
        screenSendersRef.current.set(vid, sender);
      });
      socket.emit("screen-share-started", { liveClassId: id });
      st.onended = stopScreenShare;
    } catch {
      /* user cancelled */
    }
  }, [id, socket]);

  const stopScreenShare = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    if (localScreenRef.current) localScreenRef.current.srcObject = null;
    screenSendersRef.current.forEach((sender, vid) => {
      try {
        peerConnsRef.current.get(vid)?.removeTrack(sender);
      } catch {
        /* ignore */
      }
    });
    screenSendersRef.current.clear();
    socket.emit("screen-share-stopped", { liveClassId: id });
    setScreenSharing(false);
  }, [id, socket]);

  // ─── teacher: recording ───────────────────────────────────────────────────
  const startRecording = useCallback(() => {
    const stream = screenStreamRef.current ?? cameraStreamRef.current;
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
        const res = await apiFetch(`/api/live-classes/${id}/recording`, {
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

  // ─── teacher: end class ───────────────────────────────────────────────────
  const endClass = useCallback(async () => {
    socket.emit("end-class", { liveClassId: id });
    await apiFetch(`/api/live-classes/${id}/status`, {
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

  // ─── student: toggle mic ──────────────────────────────────────────────────
  const toggleStudentMic = useCallback(async () => {
    if (studentMicOn) {
      studentMicStreamRef.current?.getTracks().forEach((t) => t.stop());
      studentMicStreamRef.current = null;
      setStudentMicOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        studentMicStreamRef.current = stream;
        if (peerConnRef.current) {
          peerConnRef.current.addTrack(stream.getAudioTracks()[0], stream);
        }
        setStudentMicOn(true);
      } catch (e) {
        console.error("Mic error:", e);
      }
    }
  }, [studentMicOn]);

  // ─── student: toggle camera ───────────────────────────────────────────────
  const toggleStudentCamera = useCallback(async () => {
    if (studentCamOn) {
      studentCamStreamRef.current?.getVideoTracks().forEach((t) => t.stop());
      if (peerConnRef.current) {
        const sender = peerConnRef.current
          .getSenders()
          .find((s) => s.track?.kind === "video");
        if (sender)
          try {
            peerConnRef.current.removeTrack(sender);
          } catch {
            /* ignore */
          }
      }
      studentCamStreamRef.current = null;
      if (studentSelfVideoRef.current)
        studentSelfVideoRef.current.srcObject = null;
      setStudentCamOn(false);
      socket.emit("student-cam-off", { liveClassId: id, userId: user.id });
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
        });
        studentCamStreamRef.current = stream;
        if (studentSelfVideoRef.current)
          studentSelfVideoRef.current.srcObject = stream;
        if (peerConnRef.current) {
          peerConnRef.current.addTrack(stream.getVideoTracks()[0], stream);
        }
        setStudentCamOn(true);
        socket.emit("student-cam-on", {
          liveClassId: id,
          userId: user.id,
          userName: user.name,
        });
      } catch (e) {
        console.error("Camera error:", e);
      }
    }
  }, [studentCamOn, id, socket, user]);

  // ─── student: raise / lower hand ─────────────────────────────────────────
  const toggleHand = useCallback(() => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    socket.emit(next ? "raise-hand" : "lower-hand", {
      liveClassId: id,
      userId: user.id,
      userName: user.name,
    });
  }, [isHandRaised, id, socket, user]);

  // ─── reactions ────────────────────────────────────────────────────────────
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

  // ─── chat ─────────────────────────────────────────────────────────────────
  const postComment = useCallback(
    async (e) => {
      e.preventDefault();
      if (!commentText.trim()) return;
      await apiFetch(`/api/live-classes/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          text: commentText.trim(),
          parentComment: replyTo?.id ?? null,
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
      await apiFetch(`/api/live-classes/${id}/questions`, {
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
      await apiFetch(`/api/live-classes/${id}/questions/${qId}/answer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: user.id }),
      });
    },
    [id, user.id],
  );

  // Mount pending screen stream once ref is available
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

  // ─── socket + WebRTC setup ────────────────────────────────────────────────
  useEffect(() => {
    loadClass();
    loadComments();
    loadQuestions();

    socket.emit("join-liveclass", id);
    apiFetch(`/api/live-classes/${id}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    if (!isTeacher) {
      socket.emit("viewer", {
        liveClassId: id,
        userId: user.id,
        userName: user.name,
      });
    }

    // ── chat / Q&A ────────────────────────────────────────────────────────
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

    // ── student: build or reuse PC to teacher ─────────────────────────────
    const getOrCreateStudentPC = (fromSocketId) => {
      if (peerConnRef.current) return peerConnRef.current;
      const pc = new RTCPeerConnection(ICE_CONFIG);
      peerConnRef.current = pc;

      pc.ontrack = ({ track, streams }) => {
        if (track.kind === "audio") {
          const s = remoteCameraRef.current?.srcObject ?? new MediaStream();
          s.addTrack(track);
          if (remoteCameraRef.current) remoteCameraRef.current.srcObject = s;
          return;
        }
        if (track.contentHint === "detail") {
          const stream = new MediaStream([track]);
          pendingScreenRef.current = stream;
          setTeacherHasScreen(true);
          setStreamActive(true);
          track.onended = () => {
            setTeacherHasScreen(false);
            pendingScreenRef.current = null;
          };
        } else {
          const s = remoteCameraRef.current?.srcObject ?? new MediaStream();
          s.addTrack(track);
          if (remoteCameraRef.current) remoteCameraRef.current.srcObject = s;
          setStreamActive(true);
        }
      };

      pc.onicecandidate = ({ candidate }) => {
        if (candidate)
          socket.emit("ice-candidate", { to: fromSocketId, candidate });
      };

      // Student mic / camera renegotiation
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
      pc.onicecandidate = ({ candidate }) => {
        if (candidate) socket.emit("ice-candidate", { to: from, candidate });
      };
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { to: from, answer, liveClassId: id });
    };

    const onAnswer = async ({ from, answer }) => {
      const pc = peerConnsRef.current.get(from);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    };

    // ── teacher: new viewer joined ────────────────────────────────────────
    const onNewViewer = async ({ viewerSocketId, userId, userName }) => {
      if (!isTeacher) return;
      setStudentTiles((prev) => {
        const next = new Map(prev);
        if (!next.has(viewerSocketId)) {
          next.set(viewerSocketId, {
            stream: null,
            userId,
            userName: userName ?? "Student",
            camOn: false,
          });
        }
        return next;
      });
      const pc = makePeerForViewer(viewerSocketId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { to: viewerSocketId, offer, liveClassId: id });
    };

    // ── teacher: handles student's renegotiation (mic / camera) ──────────
    const onStudentOffer = async ({ from, offer }) => {
      if (!isTeacher) return;
      const pc = peerConnsRef.current.get(from);
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("teacher-reanswer", { to: from, answer });
    };

    const onTeacherReanswer = async ({ answer }) => {
      if (peerConnRef.current)
        await peerConnRef.current.setRemoteDescription(
          new RTCSessionDescription(answer),
        );
    };

    const onIce = async ({ from, candidate }) => {
      try {
        const pc = isTeacher
          ? peerConnsRef.current.get(from)
          : peerConnRef.current;
        if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        /* ignore stale candidates */
      }
    };

    const onBroadcasterReady = () => {
      if (!isTeacher)
        socket.emit("viewer", {
          liveClassId: id,
          userId: user.id,
          userName: user.name,
        });
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
        studentMicStreamRef.current?.getTracks().forEach((t) => t.stop());
        studentCamStreamRef.current?.getTracks().forEach((t) => t.stop());
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
  }, [id, isTeacher]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── derived ──────────────────────────────────────────────────────────────
  const topLevel = comments.filter((c) => !c.parentComment);
  const getReplies = (cid) =>
    comments.filter(
      (c) => c.parentComment === cid || c.parentComment?.toString() === cid,
    );
  const handCount = Object.keys(raisedHands).length;
  const studentTilesList = [...studentTiles.entries()];
  const unanswered = questions.filter((q) => !q.isAnswered).length;

  if (!liveClass) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#111113]">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto animate-pulse">
            <span className="text-2xl">📡</span>
          </div>
          <p className="text-sm text-white/40 font-semibold">Loading class…</p>
        </div>
      </div>
    );
  }

  const isLive = liveClass.status === "live";
  const isEnded = liveClass.status === "ended";

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-[#111113] text-white overflow-hidden">
      {/* Reaction float animation */}
      <style>{`
        @keyframes floatUp {
          0%   { opacity:1; transform:translateY(0) scale(1); }
          70%  { opacity:.9; transform:translateY(-55px) scale(1.25); }
          100% { opacity:0; transform:translateY(-80px) scale(.8); }
        }
        .reaction-float { animation: floatUp 3s ease-out forwards; }
      `}</style>

      {/* ══ Header ═══════════════════════════════════════════════════════════ */}
      <header className="flex items-center justify-between px-5 py-3 bg-[#1c1c1e]/95 border-b border-white/8 shrink-0 z-10 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 shrink-0 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer text-sm"
          >
            ←
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white leading-tight truncate">
              {liveClass.title}
            </h1>
            <p className="text-[11px] text-white/35 leading-none mt-0.5">
              {isTeacher
                ? "You are hosting"
                : `with ${liveClass.teacher?.name}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isLive && (
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-black bg-red-500/15 text-red-400 border border-red-500/20 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Live
            </span>
          )}
          {isEnded && (
            <span className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-white/5 text-white/35 border border-white/10">
              Ended
            </span>
          )}
          <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-white/5 text-white/40 border border-white/10">
            👥 {participantCount}
          </span>
          {handCount > 0 && (
            <button
              onClick={() => {
                setChatOpen(true);
                setPanelTab("people");
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-amber-500/12 text-amber-400 border border-amber-500/20 cursor-pointer hover:bg-amber-500/20 transition-colors"
            >
              ✋ {handCount}
            </button>
          )}
          <button
            onClick={() => setChatOpen((p) => !p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border cursor-pointer transition-all
              ${
                chatOpen
                  ? "bg-violet-500/25 text-violet-300 border-violet-500/35 shadow-sm"
                  : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white"
              }`}
          >
            💬 Chat
            {comments.length > 0 && !chatOpen && (
              <span className="ml-0.5 text-[9px] opacity-70">
                ({comments.length})
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ══ Body ═════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ═ VIDEO SECTION ══════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Main video area */}
          <div className="flex-1 relative bg-[#0a0a0c] overflow-hidden">
            {/* Teacher: screen share (main) */}
            {isTeacher && (
              <video
                ref={localScreenRef}
                autoPlay
                muted
                playsInline
                className={`absolute inset-0 w-full h-full object-contain ${!screenSharing ? "hidden" : ""}`}
              />
            )}

            {/* Teacher: camera feed */}
            {isTeacher && (
              <video
                ref={localCameraRef}
                autoPlay
                muted
                playsInline
                className={`object-cover transition-all
                  ${
                    screenSharing
                      ? "absolute bottom-4 right-4 w-44 h-32 rounded-2xl border-2 border-white/15 z-20 shadow-2xl"
                      : "absolute inset-0 w-full h-full"
                  }
                  ${!cameraOn && !screenSharing ? "opacity-0" : ""}`}
              />
            )}

            {/* Student: teacher's screen share */}
            {!isTeacher && teacherHasScreen && (
              <video
                ref={remoteScreenRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-contain"
              />
            )}

            {/* Student: teacher's camera */}
            {!isTeacher && (
              <video
                ref={remoteCameraRef}
                autoPlay
                playsInline
                className={`object-cover
                  ${
                    teacherHasScreen
                      ? "absolute bottom-4 right-4 w-44 h-32 rounded-2xl border-2 border-white/15 z-20 shadow-2xl"
                      : "absolute inset-0 w-full h-full"
                  }`}
              />
            )}

            {/* Student: self-view preview (own camera on) */}
            {!isTeacher && studentCamOn && (
              <div className="absolute bottom-4 left-4 z-20">
                <div className="relative w-36 h-24 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-[#2a2a2e]">
                  <video
                    ref={studentSelfVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  <div className="absolute bottom-1 left-2 text-[10px] text-white/80 font-semibold drop-shadow-sm">
                    You
                  </div>
                </div>
              </div>
            )}

            {/* Floating reactions */}
            {reactions.map((r) => (
              <div
                key={r.id}
                className="reaction-float pointer-events-none select-none absolute z-30 text-center"
                style={{ left: `${r.x}%`, bottom: "100px" }}
              >
                <div style={{ fontSize: "2rem" }}>{r.emoji}</div>
                <div
                  style={{
                    color: "rgba(255,255,255,.75)",
                    fontSize: "10px",
                    fontWeight: 700,
                    textShadow: "0 1px 4px rgba(0,0,0,.6)",
                  }}
                >
                  {r.name}
                </div>
              </div>
            ))}

            {/* Teacher: no stream yet placeholder */}
            {isTeacher && !cameraStreamRef.current && !screenSharing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
                <div className="w-24 h-24 rounded-3xl bg-white/4 border border-white/8 flex items-center justify-center text-5xl">
                  🎥
                </div>
                <div className="text-center space-y-1">
                  <p className="text-white/60 text-sm font-semibold">
                    You haven't started broadcasting yet
                  </p>
                  <p className="text-white/30 text-xs">
                    Click{" "}
                    <strong className="text-white/50">📷 Start Camera</strong>{" "}
                    below to go live
                  </p>
                </div>
              </div>
            )}

            {/* Teacher: camera toggled off overlay */}
            {isTeacher &&
              cameraStreamRef.current &&
              !cameraOn &&
              !screenSharing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 z-10 backdrop-blur-sm">
                  <div
                    className={`w-20 h-20 rounded-full ${tileColor(user.name)} flex items-center justify-center text-3xl font-black`}
                  >
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <p className="text-white/50 text-sm font-medium">
                    Camera is off
                  </p>
                </div>
              )}

            {/* Student: waiting / ended placeholder */}
            {!isTeacher && !streamActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
                <div className="w-24 h-24 rounded-3xl bg-white/4 border border-white/8 flex items-center justify-center text-5xl">
                  {isEnded ? "📼" : "📡"}
                </div>
                <p className="text-white/50 font-bold text-base">
                  {isEnded
                    ? "This class has ended"
                    : isLive
                      ? "Waiting for teacher to start…"
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

          {/* ── Participant strip ───────────────────────────────────────────── */}
          {/* Teacher sees student tiles; students see teacher + their own tile */}
          <div className="shrink-0 px-4 py-3 bg-[#111113] border-t border-white/6 flex items-center gap-3 overflow-x-auto min-h-30">
            {isTeacher ? (
              <>
                {/* Teacher's own "tile" — avatar card in strip */}
                <div className="relative rounded-2xl overflow-hidden bg-[#2a2a2e] border border-white/8 shrink-0 w-40 h-28 flex flex-col items-center justify-center gap-1.5">
                  <div
                    className={`w-12 h-12 rounded-full ${tileColor(user.name)} flex items-center justify-center text-white text-xl font-black`}
                  >
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="text-center px-2">
                    <p className="text-[11px] text-white/70 font-semibold truncate">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-violet-400 font-bold">
                      Host
                    </p>
                  </div>
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    {micOn && <span className="text-[11px]">🎤</span>}
                    {cameraOn && <span className="text-[11px]">📷</span>}
                    {screenSharing && <span className="text-[11px]">🖥️</span>}
                    {isRecording && (
                      <span className="text-[11px] animate-pulse">⏺</span>
                    )}
                  </div>
                </div>

                {/* Student tiles */}
                {studentTilesList.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-[12px] text-white/20 font-medium">
                      Waiting for students to join…
                    </p>
                  </div>
                ) : (
                  studentTilesList.map(([sid, info]) => (
                    <ParticipantTile
                      key={sid}
                      stream={info.camOn ? info.stream : null}
                      name={info.userName}
                      label={info.userName}
                      indicator={
                        raisedHands[info.userId]
                          ? "✋"
                          : info.camOn
                            ? "📷"
                            : null
                      }
                    />
                  ))
                )}
              </>
            ) : (
              <>
                {/* Teacher tile (just avatar + name) */}
                <div className="relative rounded-2xl overflow-hidden bg-[#2a2a2e] border border-violet-500/20 shrink-0 w-40 h-28 flex flex-col items-center justify-center gap-1.5">
                  <div
                    className={`w-12 h-12 rounded-full ${tileColor(liveClass.teacher?.name ?? "T")} flex items-center justify-center text-white text-xl font-black`}
                  >
                    {liveClass.teacher?.name?.[0]?.toUpperCase() ?? "T"}
                  </div>
                  <div className="text-center px-2">
                    <p className="text-[11px] text-white/70 font-semibold truncate">
                      {liveClass.teacher?.name ?? "Teacher"}
                    </p>
                    <p className="text-[10px] text-violet-400 font-bold">
                      Host
                    </p>
                  </div>
                </div>

                {/* Student's own tile (when camera is on) */}
                {studentCamOn && (
                  <div className="relative rounded-2xl overflow-hidden bg-[#2a2a2e] border border-emerald-500/20 shrink-0 w-40 h-28">
                    <video
                      ref={studentSelfVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                    <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-linear-to-t from-black/80 to-transparent">
                      <span className="text-[11px] text-white font-semibold">
                        You
                      </span>
                    </div>
                    <div className="absolute top-2 right-2 text-[11px]">📷</div>
                  </div>
                )}

                {studentTilesList.length === 0 && !studentCamOn && (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-[12px] text-white/20 font-medium">
                      Turn on your camera to be seen by others
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ══ Control bar ════════════════════════════════════════════════ */}
          <div className="shrink-0 px-5 py-3 bg-[#1c1c1e]/95 border-t border-white/8 flex items-center justify-between gap-4 backdrop-blur-sm">
            {/* Left: media controls */}
            <div className="flex items-center gap-2">
              {isTeacher ? (
                <>
                  {!cameraStreamRef.current ? (
                    <CtrlBtn
                      onClick={startCamera}
                      label="Start"
                      disabled={isEnded}
                      wide
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
                    🖥️
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
                        label={recDone ? "Saved" : "Record"}
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
                    active={studentMicOn}
                    label={studentMicOn ? "Mute" : "Speak"}
                  >
                    {studentMicOn ? "🎤" : "🔇"}
                  </CtrlBtn>
                  <CtrlBtn
                    onClick={toggleStudentCamera}
                    active={studentCamOn}
                    label={studentCamOn ? "Cam Off" : "Camera"}
                  >
                    {studentCamOn ? "📷" : "📵"}
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
            </div>

            {/* Center: emoji reactions */}
            <div className="relative">
              <CtrlBtn
                onClick={() => setShowReactPicker((p) => !p)}
                label="React"
              >
                😊
              </CtrlBtn>
              {showReactPicker && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex gap-2 p-3 rounded-2xl bg-[#2a2a2e] border border-white/12 shadow-2xl z-50">
                  {REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => sendReaction(emoji)}
                      className="text-2xl hover:scale-125 transition-transform cursor-pointer select-none"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: end / leave */}
            <div>
              {isTeacher ? (
                confirmEnd ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-white/35">
                      End for everyone?
                    </span>
                    <button
                      onClick={endClass}
                      className="px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-bold cursor-pointer hover:bg-red-600 active:scale-95 transition-all"
                    >
                      End Class
                    </button>
                    <button
                      onClick={() => setConfirmEnd(false)}
                      className="px-3 py-2 rounded-xl bg-white/10 text-white/60 text-xs font-bold cursor-pointer hover:bg-white/15 active:scale-95 transition-all"
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

        {/* ═ CHAT / Q&A / PEOPLE SIDEBAR ════════════════════════════════════ */}
        {chatOpen && (
          <aside className="w-80 flex flex-col border-l border-white/8 bg-[#1c1c1e] shrink-0">
            {/* Tab bar */}
            <div className="flex border-b border-white/8 shrink-0">
              {[
                { key: "chat", label: "💬 Chat", badge: comments.length },
                { key: "qa", label: "❓ Q&A", badge: unanswered },
                { key: "people", label: "👥 People", badge: handCount || null },
              ].map(({ key, label, badge }) => (
                <button
                  key={key}
                  onClick={() => setPanelTab(key)}
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wide transition-colors cursor-pointer
                    ${
                      panelTab === key
                        ? "text-violet-300 border-b-2 border-violet-400"
                        : "text-white/35 hover:text-white/70"
                    }`}
                >
                  {label}
                  {badge > 0 && (
                    <span className="ml-1 text-[9px] opacity-60">
                      ({badge})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ─ Chat ─────────────────────────────────────────────────────── */}
            {panelTab === "chat" && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                  {topLevel.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-2 opacity-30">
                      <span className="text-4xl">💬</span>
                      <p className="text-xs text-white/60">No messages yet</p>
                    </div>
                  )}
                  {topLevel.map((c) => {
                    const replies = getReplies(c.id);
                    return (
                      <div key={c.id}>
                        <div className="flex gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center
                              text-white text-[10px] font-black shrink-0 ${tileColor(c.user?.name ?? "?")}`}
                          >
                            {c.user?.name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-1.5 mb-0.5 flex-wrap">
                              <span className="text-[12px] font-bold text-white/90">
                                {c.user?.name}
                              </span>
                              {c.isTeacherReply && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/20">
                                  Host
                                </span>
                              )}
                              <span className="text-[10px] text-white/25">
                                {timeAgo(c.createdAt)}
                              </span>
                            </div>
                            <p className="text-[13px] text-white/75 leading-snug wrap-break-word">
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
                              className="mt-0.5 text-[10px] font-bold text-white/25 hover:text-violet-400 transition-colors cursor-pointer"
                            >
                              ↩ Reply
                            </button>
                          </div>
                        </div>
                        {replies.length > 0 && (
                          <div className="ml-9 mt-2 pl-3 border-l-2 border-violet-500/20 space-y-2.5">
                            {replies.map((r) => (
                              <div key={r.id} className="flex gap-2">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center
                                    text-white text-[9px] font-black shrink-0 ${tileColor(r.user?.name ?? "?")}`}
                                >
                                  {r.user?.name?.[0]?.toUpperCase() ?? "?"}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-baseline gap-1.5 mb-0.5 flex-wrap">
                                    <span className="text-[11px] font-bold text-white/90">
                                      {r.user?.name}
                                    </span>
                                    {r.isTeacherReply && (
                                      <span className="text-[9px] font-black uppercase px-1 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/20">
                                        Host
                                      </span>
                                    )}
                                    <span className="text-[10px] text-white/25">
                                      {timeAgo(r.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-[12px] text-white/70 leading-snug wrap-break-word">
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
                  <div className="mx-3 mb-1 flex items-center justify-between px-3 py-1.5 rounded-xl bg-violet-500/8 border border-violet-500/15 text-[11px]">
                    <span className="text-white/50">
                      Replying to{" "}
                      <span className="font-bold text-violet-300">
                        {replyTo.userName}
                      </span>
                    </span>
                    <button
                      onClick={() => setReplyTo(null)}
                      className="text-white/35 hover:text-white cursor-pointer text-base leading-none"
                    >
                      ×
                    </button>
                  </div>
                )}

                <form
                  onSubmit={postComment}
                  className="p-3 border-t border-white/8 flex gap-2 shrink-0"
                >
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={
                      replyTo
                        ? `Reply to ${replyTo.userName}…`
                        : "Send a message…"
                    }
                    className="flex-1 px-3 py-2 rounded-xl text-sm outline-none border border-white/10 focus:border-violet-500/50 bg-white/5 text-white placeholder:text-white/25 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-violet-500 text-white disabled:opacity-40 cursor-pointer shrink-0 hover:bg-violet-600 transition-colors active:scale-95"
                  >
                    ↑
                  </button>
                </form>
              </>
            )}

            {/* ─ Q&A ──────────────────────────────────────────────────────── */}
            {panelTab === "qa" && (
              <>
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0">
                  {questions.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-2 opacity-30">
                      <span className="text-4xl">❓</span>
                      <p className="text-xs text-white/60">No questions yet</p>
                    </div>
                  )}
                  {questions.map((q) => (
                    <div
                      key={q.id}
                      className={`p-3 rounded-2xl border ${
                        q.isAnswered
                          ? "bg-emerald-500/6 border-emerald-500/15"
                          : "bg-white/3 border-white/8"
                      }`}
                    >
                      <div className="flex gap-2">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center
                            text-white text-[10px] font-black shrink-0 ${tileColor(q.student?.name ?? "?")}`}
                        >
                          {q.student?.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                            <span className="text-[12px] font-bold text-white/90">
                              {q.student?.name}
                            </span>
                            {q.isAnswered && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                Answered
                              </span>
                            )}
                          </div>
                          <p className="text-[13px] text-white/75 leading-snug wrap-break-word">
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
                            className="text-[11px] font-bold text-white/30 hover:text-violet-400 cursor-pointer transition-colors"
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
                    className="p-3 border-t border-white/8 flex gap-2 shrink-0"
                  >
                    <input
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      placeholder="Ask a question…"
                      className="flex-1 px-3 py-2 rounded-xl text-sm outline-none border border-white/10 focus:border-violet-500/50 bg-white/5 text-white placeholder:text-white/25 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={!questionText.trim()}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-violet-500 text-white disabled:opacity-40 cursor-pointer shrink-0 hover:bg-violet-600 transition-colors active:scale-95"
                    >
                      ↑
                    </button>
                  </form>
                )}
              </>
            )}

            {/* ─ People ───────────────────────────────────────────────────── */}
            {panelTab === "people" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-5 min-h-0">
                {/* Host */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-2">
                    Host
                  </p>
                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-violet-500/8 border border-violet-500/15">
                    <div
                      className={`w-8 h-8 rounded-full ${tileColor(liveClass.teacher?.name ?? "T")} flex items-center justify-center text-white text-sm font-black shrink-0`}
                    >
                      {liveClass.teacher?.name?.[0]?.toUpperCase() ?? "T"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-white truncate">
                        {liveClass.teacher?.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {isTeacher && cameraOn && (
                          <span className="text-[10px] text-emerald-400 font-bold">
                            📷 cam
                          </span>
                        )}
                        {isTeacher && micOn && (
                          <span className="text-[10px] text-emerald-400 font-bold">
                            🎤 mic
                          </span>
                        )}
                        {isTeacher && screenSharing && (
                          <span className="text-[10px] text-blue-400 font-bold">
                            🖥️ screen
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
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/60 mb-2">
                      ✋ Raised Hands ({handCount})
                    </p>
                    <div className="space-y-1.5">
                      {Object.entries(raisedHands).map(([uid, name]) => (
                        <div
                          key={uid}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/8 border border-amber-500/15"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-full ${tileColor(name)} flex items-center justify-center text-white text-[10px] font-black`}
                            >
                              {name?.[0]?.toUpperCase()}
                            </div>
                            <span className="text-[12px] font-bold text-white/90">
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
                              className="text-[10px] text-white/30 hover:text-red-400 cursor-pointer transition-colors font-bold"
                            >
                              Lower ↓
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Students */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-2">
                    Students · {participantCount}
                  </p>
                  {isTeacher && studentTilesList.length > 0 ? (
                    <div className="space-y-1.5">
                      {studentTilesList.map(([sid, info]) => (
                        <div
                          key={sid}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/3 border border-white/8"
                        >
                          <div
                            className={`w-7 h-7 rounded-full ${tileColor(info.userName)} flex items-center justify-center text-white text-[10px] font-black shrink-0`}
                          >
                            {info.userName?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <span className="text-[12px] font-semibold text-white/80 flex-1 truncate">
                            {info.userName}
                          </span>
                          {info.camOn && (
                            <span className="text-[10px] text-emerald-400 font-bold">
                              📷
                            </span>
                          )}
                          {raisedHands[info.userId] && (
                            <span className="text-amber-400 text-sm">✋</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12px] text-white/30">
                      {participantCount}{" "}
                      {participantCount === 1 ? "person has" : "people have"}{" "}
                      joined this session.
                    </p>
                  )}
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
        )}
      </div>
    </div>
  );
}
