"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, supabaseUrl, supabaseAnonKey } from "@/lib/supabase";
import { createVideoRecord } from "@/lib/admin-actions";

/** Upload limits enforced client-side (and again by RLS + server validation). */
const MAX_VIDEO_BYTES = 500 * 1024 * 1024; // ~500 MB
const MAX_THUMB_BYTES = 5 * 1024 * 1024; // ~5 MB

/** Direct XHR upload to Supabase Storage so we get a real progress bar. */
function uploadToStorage(args: {
  bucket: string;
  path: string;
  file: File;
  accessToken: string;
  onProgress: (fraction: number) => void;
}): Promise<void> {
  const { bucket, path, file, accessToken, onProgress } = args;
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${supabaseUrl()}/storage/v1/object/${bucket}/${path}`);
    xhr.setRequestHeader("apikey", supabaseAnonKey());
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText.slice(0, 200)}`));
    };
    xhr.onerror = () => reject(new Error("Upload failed: network error"));
    xhr.send(file);
  });
}

function readDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const el = document.createElement("video");
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      const d = el.duration;
      URL.revokeObjectURL(el.src);
      resolve(Number.isFinite(d) ? Math.round(d) : 0);
    };
    el.onerror = () => resolve(0);
    el.src = URL.createObjectURL(file);
  });
}

const sanitize = (name: string) => name.replace(/[^a-zA-Z0-9.\-_]/g, "_");

/** Admin-only upload form (rendered inside /admin/videos). */
export default function UploadForm({ userId, categories }: { userId: string; categories: string[] }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(categories[0] ?? "");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<{ label: string; pct: number } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  function validateFiles(): string | null {
    if (!videoFile) return "Please choose a video file.";
    if (!videoFile.type.startsWith("video/")) return "Only video files are allowed.";
    if (videoFile.size > MAX_VIDEO_BYTES) return "Video is too large — max 500 MB.";
    if (thumbFile) {
      if (!thumbFile.type.startsWith("image/")) return "Thumbnail must be an image file.";
      if (thumbFile.size > MAX_THUMB_BYTES) return "Thumbnail is too large — max 5 MB.";
    }
    if (!category) return "Please choose a category.";
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const problem = validateFiles();
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/signin?next=/admin/videos");
        return;
      }
      const accessToken = session.access_token;
      const stamp = Date.now();

      setProgress({ label: "Uploading video...", pct: 0 });
      const videoPath = `${userId}/${stamp}-${sanitize(videoFile!.name)}`;
      await uploadToStorage({
        bucket: "videos",
        path: videoPath,
        file: videoFile!,
        accessToken,
        onProgress: (f) => setProgress({ label: "Uploading video...", pct: Math.round(f * 100) }),
      });
      const videoUrl = `${supabaseUrl()}/storage/v1/object/public/videos/${videoPath}`;

      let thumbnailUrl: string | null = null;
      if (thumbFile) {
        setProgress({ label: "Uploading thumbnail...", pct: 0 });
        const thumbPath = `${userId}/${stamp}-${sanitize(thumbFile.name)}`;
        await uploadToStorage({
          bucket: "thumbnails",
          path: thumbPath,
          file: thumbFile,
          accessToken,
          onProgress: (f) => setProgress({ label: "Uploading thumbnail...", pct: Math.round(f * 100) }),
        });
        thumbnailUrl = `${supabaseUrl()}/storage/v1/object/public/thumbnails/${thumbPath}`;
      }

      setProgress({ label: "Saving video...", pct: 100 });
      const duration = await readDuration(videoFile!);
      // Server action: requireAdmin() + validation + audit log.
      const id = await createVideoRecord({
        title: title.trim(),
        description: description.trim() || undefined,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        duration,
        category,
      });
      router.push(`/watch/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setProgress(null);
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-yt-border bg-yt-bg px-4 py-2.5 text-sm outline-none transition-shadow placeholder:text-yt-muted focus:border-yt-pink focus:shadow-neon-sm";

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-xl font-bold">Upload video</h1>
      <p className="mt-1 text-sm text-yt-muted">Your video goes live as soon as the upload finishes.</p>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Title *</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My awesome video" className={inputCls} maxLength={120} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell viewers about your video..." rows={4} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputCls} max-w-xs`}>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Video file * (max 500 MB)</label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-yt-muted file:mr-3 file:rounded-full file:border-0 file:bg-yt-surface file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-yt-hover"
          />
          {videoFile && <p className="mt-1 text-xs text-yt-muted">{videoFile.name} ({(videoFile.size / 1048576).toFixed(1)} MB)</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Thumbnail (optional, max 5 MB)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setThumbFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-yt-muted file:mr-3 file:rounded-full file:border-0 file:bg-yt-surface file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-yt-hover"
          />
        </div>

        {progress && (
          <div className="rounded-lg bg-yt-surface p-3">
            <p className="text-sm font-medium">{progress.label}</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-yt-hover">
              <div className="h-full rounded-full bg-gradient-to-r from-yt-red to-yt-pink transition-all" style={{ width: `${progress.pct}%` }} />
            </div>
            <p className="mt-1 text-xs text-yt-muted">{progress.pct}%</p>
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-gradient-to-r from-yt-red to-yt-pink py-2.5 text-sm font-semibold text-white shadow-neon hover:shadow-neon-lg disabled:opacity-50 disabled:shadow-none"
        >
          {busy ? "Uploading..." : "Publish video"}
        </button>
      </form>
    </div>
  );
}
