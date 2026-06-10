'use client'
import { formatDateTime } from "#/lib/format";
import { parseError } from "#/lib/parseError";
import { getMyComments, getMyLikedPosts, getMyPosts } from "#/service/community";
import { type CommentResponse, type PostListItem } from "#/service/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Tab = "posts" | "likes" | "comments";

const TABS: { key: Tab; label: string }[] = [
  { key: "posts", label: "내가 쓴 글" },
  { key: "likes", label: "공감한 글" },
  { key: "comments", label: "내 댓글" },
];

const PAGE_SIZE = 10;

export default function MyActivityPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("posts");

  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (nextPage: number, append: boolean) => {
      setLoading(true);
      setError(null);
      try {
        if (tab === "comments") {
          const data = await getMyComments(nextPage, PAGE_SIZE);
          setComments((prev) => (append ? [...prev, ...data.content] : data.content));
          setPage(data.number);
          setTotalPages(data.totalPages);
        } else {
          const data =
            tab === "posts"
              ? await getMyPosts(nextPage, PAGE_SIZE)
              : await getMyLikedPosts(nextPage, PAGE_SIZE);
          setPosts((prev) => (append ? [...prev, ...data.content] : data.content));
          setPage(data.number);
          setTotalPages(data.totalPages);
        }
      } catch (err) {
        setError(parseError(err));
      } finally {
        setLoading(false);
      }
    },
    [tab]
  );

  useEffect(() => {
    setPosts([]);
    setComments([]);
    fetchPage(0, false);
  }, [fetchPage]);

  const isEmpty = tab === "comments" ? comments.length === 0 : posts.length === 0;

  return (
    <div className="flex flex-col bg-[#f2f4f6] px-5 pb-8 pt-2">
      <div className="mb-3 flex items-center gap-2">
        <button
          className="flex items-center gap-1 text-[14px] font-semibold text-[#4e5968] active:scale-95"
          onClick={() => router.push("/community")}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          커뮤니티
        </button>
        <h1 className="text-[20px] font-bold tracking-[-0.02em] text-[#191f28]">내 활동</h1>
      </div>

      <div className="mb-3 flex gap-1 rounded-[12px] bg-[#e9ebee] p-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            className={`grow rounded-[10px] py-2 text-[14px] font-semibold transition-colors active:scale-[0.98] ${
              tab === key ? "bg-white text-[#191f28] shadow-[0_1px_3px_rgba(0,0,0,0.08)]" : "text-[#8b95a1]"
            }`}
            onClick={() => setTab(key)}
          >{label}</button>
        ))}
      </div>

      {error && (
        <p className="rounded-[16px] bg-white px-4 py-6 text-center text-[14px] text-[#f04452] shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          {error}
        </p>
      )}

      {!error && isEmpty && !loading && (
        <p className="rounded-[16px] bg-white px-4 py-10 text-center text-[14px] text-[#8b95a1] shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          {tab === "posts" && "아직 작성한 글이 없어요."}
          {tab === "likes" && "아직 공감한 글이 없어요."}
          {tab === "comments" && "아직 작성한 댓글이 없어요."}
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {tab === "comments"
          ? comments.map((comment) => (
              <li
                key={comment.commentId}
                className="rounded-[16px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
              >
                <p className="whitespace-pre-wrap text-[14px] text-[#191f28]">{comment.content}</p>
                <p className="mt-1.5 text-[12px] text-[#8b95a1]">{formatDateTime(comment.createdAt)}</p>
              </li>
            ))
          : posts.map((post) => (
              <li
                key={post.postId}
                className="flex items-center justify-between gap-3 rounded-[16px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition-transform active:scale-[0.99]"
                onClick={() => router.push(`/community/${post.postId}`)}
              >
                <div className="min-w-0 grow">
                  <h3 className="truncate text-[16px] font-semibold text-[#191f28]">{post.title}</h3>
                  <p className="mt-0.5 text-[12px] text-[#8b95a1]">
                    {post.writerName} · {formatDateTime(post.createdAt)} · 조회 {post.viewCount} · 공감 {post.likeCount}
                  </p>
                  {post.categories.length > 0 && (
                    <p className="mt-1 truncate text-[12px] font-medium text-[#3182f6]">
                      {post.categories.map((name) => `#${name}`).join(" ")}
                    </p>
                  )}
                </div>
                <div className="flex h-fit shrink-0 flex-col items-center justify-center rounded-[12px] bg-[#f2f4f6] px-3 py-1.5">
                  <p className="text-[15px] font-bold text-[#191f28]">{post.commentCount}</p>
                  <p className="text-[11px] text-[#8b95a1]">댓글</p>
                </div>
              </li>
            ))}
      </ul>

      {loading && <p className="py-4 text-center text-[13px] text-[#8b95a1]">불러오는 중...</p>}

      {!loading && page < totalPages - 1 && (
        <button
          className="mt-2 rounded-[14px] bg-white py-3 text-[14px] font-semibold text-[#4e5968] shadow-[0_2px_12px_rgba(0,0,0,0.05)] active:scale-[0.99]"
          onClick={() => fetchPage(page + 1, true)}
        >
          더보기
        </button>
      )}
    </div>
  );
}
