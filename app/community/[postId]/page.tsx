'use client'
import Image from "next/image";
import { cleanName, formatDateTime } from "#/lib/format";
import { parseError } from "#/lib/parseError";
import {
  addComment,
  deleteComment,
  deletePost,
  getPost,
  toggleLike,
  updateComment,
} from "#/service/community";
import { type PostDetail } from "#/service/types";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = Number(params.postId);

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myName, setMyName] = useState("");

  const [liking, setLiking] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setMyName(cleanName(localStorage.getItem("userName") ?? ""));
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setPost(await getPost(postId));
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Number.isFinite(postId)) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const isMine = (writerName: string) => myName !== "" && cleanName(writerName) === myName;

  const onToggleLike = async () => {
    if (!post || liking) return;
    setLiking(true);
    // 낙관적 업데이트
    const prev = post;
    const nextLiked = !post.likedByMe;
    setPost({
      ...post,
      likedByMe: nextLiked,
      likeCount: post.likeCount + (nextLiked ? 1 : -1),
    });
    try {
      // 서버가 최종 좋아요 상태(isLiked)를 반환 → 직전 상태(prev) 기준으로 카운트 보정
      const finalLiked = await toggleLike(postId);
      const delta = finalLiked === prev.likedByMe ? 0 : finalLiked ? 1 : -1;
      setPost((p) =>
        p
          ? {
              ...p,
              likedByMe: finalLiked,
              likeCount: prev.likeCount + delta,
            }
          : p
      );
    } catch (err) {
      setPost(prev); // 롤백
      toast.error(parseError(err));
    } finally {
      setLiking(false);
    }
  };

  const onAddComment = async () => {
    const content = commentInput.trim();
    if (!content || submitting) return;
    setSubmitting(true);
    try {
      await addComment(postId, content);
      setCommentInput("");
      await load();
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onSaveEdit = async (commentId: number) => {
    const content = editingText.trim();
    if (!content) return;
    try {
      await updateComment(postId, commentId, content);
      setEditingId(null);
      setEditingText("");
      await load();
    } catch (err) {
      toast.error(parseError(err));
    }
  };

  const onDeleteComment = async (commentId: number) => {
    if (!confirm("댓글을 삭제할까요?")) return;
    try {
      await deleteComment(postId, commentId);
      await load();
    } catch (err) {
      toast.error(parseError(err));
    }
  };

  const onDeletePost = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await deletePost(postId);
      toast.success("게시글을 삭제했어요.");
      router.push("/community");
    } catch (err) {
      toast.error(parseError(err));
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading && !post) {
    return <p className="bg-[#f2f4f6] px-5 py-20 text-center text-[14px] text-[#8b95a1]">불러오는 중...</p>;
  }

  if (error && !post) {
    return (
      <div className="flex flex-col items-center gap-4 bg-[#f2f4f6] px-5 py-20">
        <p className="text-[16px] font-semibold text-[#191f28]">{error}</p>
        <button
          className="rounded-[14px] bg-[#3182f6] px-5 py-2.5 text-[14px] font-semibold text-white active:scale-[0.97]"
          onClick={load}
        >다시 시도</button>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="flex flex-col bg-[#f2f4f6] px-5 pb-8 pt-2">
      <div className="mb-2 flex items-center justify-between">
        <button
          className="flex items-center gap-1 text-[14px] font-semibold text-[#4e5968] active:scale-95"
          onClick={() => router.push("/community")}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          목록
        </button>
        {isMine(post.writerName) && (
          <div className="flex items-center gap-2">
            <button
              className="rounded-full bg-[rgba(100,168,255,0.15)] px-3.5 py-1.5 text-[13px] font-semibold text-[#2272eb] active:scale-95"
              onClick={() => router.push(`/community/${postId}/edit`)}
            >수정</button>
            <button
              className="rounded-full bg-[rgba(240,68,82,0.1)] px-3.5 py-1.5 text-[13px] font-semibold text-[#f04452] active:scale-95"
              onClick={() => setConfirmDelete(true)}
            >삭제</button>
          </div>
        )}
      </div>

      <section className="flex flex-col gap-3">
        <div className="rounded-[20px] bg-white p-5">
          <h1 className="text-[22px] font-bold tracking-[-0.02em] text-[#191f28]">{post.title}</h1>
          <div className="mt-3 flex flex-row items-center gap-2.5">
            <Image src="/person.png" alt="" width={40} height={40} className="rounded-full bg-[#f2f4f6]" />
            <div className="flex flex-col">
              <p className="text-[14px] font-semibold text-[#191f28]">{post.writerName}</p>
              <p className="text-[12px] text-[#8b95a1]">
                {formatDateTime(post.createdAt)} · 조회 {post.viewCount}
              </p>
            </div>
          </div>
          {post.categories.length > 0 && (
            <p className="mt-2 text-[12px] font-medium text-[#3182f6]">
              {post.categories.map((name) => `#${name}`).join(" ")}
            </p>
          )}
        </div>

        <div className="rounded-[20px] bg-white p-5">
          <div className="whitespace-pre-wrap text-[16px] leading-[1.6] text-[#191f28]">
            {post.content}
          </div>

          {post.imageUrls.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              {post.imageUrls.map((url) => (
                <img
                  key={url}
                  src={url}
                  alt="첨부 이미지"
                  className="w-full rounded-[14px] object-cover"
                />
              ))}
            </div>
          )}

          <div className="mt-5 flex justify-center">
            <button
              className="flex items-center gap-1.5 rounded-full bg-[#f2f4f6] px-5 py-2.5 text-[14px] font-semibold text-[#4e5968] transition-transform active:scale-[0.97] disabled:opacity-60"
              onClick={onToggleLike}
              disabled={liking}
            >
              <span className="text-[18px] text-[#f04452]">{post.likedByMe ? "♥" : "♡"}</span>
              공감 {post.likeCount}
            </button>
          </div>
        </div>

        <div className="rounded-[20px] bg-white p-5">
          <p className="text-[15px] font-bold text-[#191f28]">댓글 {post.commentCount}</p>

          <ul className="mt-3 flex flex-col gap-4">
            {post.comments.length === 0 && (
              <li className="py-4 text-center text-[13px] text-[#8b95a1]">
                첫 댓글을 남겨보세요.
              </li>
            )}
            {post.comments.map((comment) => (
              <li key={comment.commentId} className="flex flex-row gap-2.5">
                <Image src="/person.png" alt="" width={36} height={36} className="shrink-0 rounded-full bg-[#f2f4f6]" />
                <div className="flex grow flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-semibold text-[#191f28]">{comment.writerName}</p>
                    {isMine(comment.writerName) && editingId !== comment.commentId && (
                      <div className="flex gap-2 text-[12px] font-semibold">
                        <button
                          className="text-[#8b95a1] active:scale-95"
                          onClick={() => {
                            setEditingId(comment.commentId);
                            setEditingText(comment.content);
                          }}
                        >수정</button>
                        <button
                          className="text-[#f04452] active:scale-95"
                          onClick={() => onDeleteComment(comment.commentId)}
                        >삭제</button>
                      </div>
                    )}
                  </div>

                  {editingId === comment.commentId ? (
                    <div className="mt-1 flex flex-col gap-2">
                      <textarea
                        className="w-full resize-none rounded-[10px] bg-[#f2f4f6] p-2.5 text-[14px] text-[#191f28] focus:outline-none"
                        rows={2}
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                      />
                      <div className="flex justify-end gap-2 text-[13px] font-semibold">
                        <button
                          className="rounded-[8px] px-3 py-1.5 text-[#8b95a1] active:scale-95"
                          onClick={() => setEditingId(null)}
                        >취소</button>
                        <button
                          className="rounded-[8px] bg-[#3182f6] px-3 py-1.5 text-white active:scale-[0.97]"
                          onClick={() => onSaveEdit(comment.commentId)}
                        >저장</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap text-[14px] text-[#4e5968]">{comment.content}</p>
                      <p className="text-[11px] text-[#8b95a1]">{formatDateTime(comment.createdAt)}</p>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-end gap-2 border-t border-[#e5e8eb] pt-4">
            <textarea
              className="grow resize-none rounded-[12px] bg-[#f2f4f6] p-3 text-[14px] text-[#191f28] placeholder:text-[#b0b8c1] focus:outline-none"
              rows={2}
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="댓글을 입력하세요."
            />
            <button
              className="shrink-0 rounded-[12px] bg-[#3182f6] px-4 py-2.5 text-[14px] font-semibold text-white transition-transform active:scale-[0.97] disabled:opacity-60"
              onClick={onAddComment}
              disabled={submitting || commentInput.trim() === ""}
            >등록</button>
          </div>
        </div>
      </section>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-8">
          <button
            className="absolute inset-0 bg-[rgba(2,9,19,0.5)] motion-safe:animate-[fadeIn_150ms_ease-out]"
            onClick={() => !deleting && setConfirmDelete(false)}
            aria-label="닫기"
          />
          <div className="relative w-full max-w-xs rounded-[16px] bg-white p-6 motion-safe:animate-[fadeIn_150ms_ease-out]">
            <h2 className="text-[18px] font-bold tracking-[-0.01em] text-[#191f28]">
              게시글을 삭제할까요?
            </h2>
            <p className="mt-2 text-[14px] leading-[1.5] text-[#6b7684]">
              삭제하면 댓글과 공감, 첨부 사진도 함께 사라져요. 되돌릴 수 없어요.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="flex-1 rounded-[14px] bg-[#f2f4f6] py-3 text-[15px] font-semibold text-[#4e5968] transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                취소
              </button>
              <button
                type="button"
                onClick={onDeletePost}
                disabled={deleting}
                className="flex-1 rounded-[14px] bg-[#f04452] py-3 text-[15px] font-semibold text-white transition-transform active:enabled:scale-[0.98] disabled:opacity-60"
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
