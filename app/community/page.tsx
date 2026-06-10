'use client'
import Icon from "@/components/IconComponents/Icon";
import { getCachedAllConditions } from "#/lib/cache";
import { formatDateTime } from "#/lib/format";
import { parseError } from "#/lib/parseError";
import { getPosts, searchPosts, type PostSort } from "#/service/community";
import { type Condition, type PostListItem } from "#/service/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const PAGE_SIZE = 10;

export default function Community() {
  const router = useRouter();

  const [conditions, setConditions] = useState<Condition[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isFreeOnly, setFreeOnly] = useState(false);
  const [isRecentOrder, setRecentOrder] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState(""); // 실제 적용된 검색어

  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCachedAllConditions()
      .then(setConditions)
      .catch(() => setConditions([]));
  }, []);

  const sort: PostSort = isRecentOrder ? "createdAt,desc" : "likeCount,desc";

  const fetchPage = useCallback(
    async (nextPage: number, append: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const data = keyword
          ? await searchPosts(keyword, nextPage, PAGE_SIZE)
          : await getPosts({
              isFree: isFreeOnly,
              conditionIds: [...selected],
              page: nextPage,
              size: PAGE_SIZE,
              sort,
            });
        setPosts((prev) => (append ? [...prev, ...data.content] : data.content));
        setPage(data.number);
        setTotalPages(data.totalPages);
      } catch (err) {
        setError(parseError(err));
        if (!append) setPosts([]);
      } finally {
        setLoading(false);
      }
    },
    // selected는 Set이라 참조비교가 불안정 → 정렬된 문자열 키로 의존성 고정
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [keyword, isFreeOnly, sort, [...selected].sort().join(",")]
  );

  useEffect(() => {
    fetchPage(0, false);
  }, [fetchPage]);

  const isAllSelected = selected.size === 0 && !isFreeOnly && !keyword;

  const selectAll = () => {
    setSelected(new Set());
    setFreeOnly(false);
    setKeyword("");
    setSearchInput("");
  };

  const selectFree = () => {
    setSelected(new Set());
    setFreeOnly(true);
    setKeyword("");
  };

  const toggleCondition = (id: number) => {
    setFreeOnly(false);
    setKeyword("");
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submitSearch = () => {
    const trimmed = searchInput.trim();
    setKeyword(trimmed);
    if (trimmed) {
      setSelected(new Set());
      setFreeOnly(false);
    }
  };

  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-3.5 h-9 text-[14px] font-semibold transition-transform active:scale-[0.97] ${
      active ? "bg-[#3182f6] text-white" : "bg-[#f2f4f6] text-[#4e5968]"
    }`;

  return (
    <div className="relative flex min-h-screen flex-col bg-white pb-8">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-5 pt-2 pb-2">
        <h1 className="text-[24px] font-bold tracking-[-0.02em] text-[#191f28]">커뮤니티</h1>
        <button
          className="rounded-full bg-[#f2f4f6] px-3.5 py-2 text-[13px] font-semibold text-[#4e5968] active:scale-95"
          onClick={() => router.push("/community/mine")}
        >
          내 활동
        </button>
      </header>

      {/* 검색 */}
      <div className="px-5 pt-1 pb-3">
        <div className="flex h-12 items-center gap-2 rounded-[14px] bg-[#f2f4f6] px-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b95a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="grow bg-transparent text-[15px] text-[#191f28] placeholder:text-[#b0b8c1] focus:outline-none"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitSearch()}
            placeholder="제목, 내용, 작성자 검색"
          />
          {searchInput && (
            <button
              className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#d1d6db] text-white active:scale-90"
              onClick={selectAll}
              aria-label="검색어 지우기"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <line x1="5" y1="5" x2="19" y2="19" />
                <line x1="19" y1="5" x2="5" y2="19" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 분류 칩 (가로 스크롤) */}
      <div className="flex gap-2 overflow-x-auto px-5 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button className={chip(isAllSelected)} onClick={selectAll}>전체</button>
        <button className={chip(isFreeOnly)} onClick={selectFree}>자유게시판</button>
        {conditions.map((c) => (
          <button
            key={c.conditionId}
            className={chip(selected.has(c.conditionId))}
            onClick={() => toggleCondition(c.conditionId)}
          >
            {c.conditionName}
          </button>
        ))}
      </div>

      {/* 정렬 */}
      <div className="flex items-center justify-between px-5 pb-1">
        <h2 className="text-[18px] font-bold text-[#191f28]">게시글</h2>
        <div className="flex gap-0.5 rounded-[10px] bg-[#f2f4f6] p-1">
          <button
            className={`rounded-[8px] px-3 py-1 text-[13px] font-semibold transition-colors active:scale-95 ${
              isRecentOrder ? "bg-white text-[#191f28] shadow-[0_2px_4px_rgba(0,0,0,0.06)]" : "text-[#8b95a1]"
            }`}
            onClick={() => setRecentOrder(true)}
          >최신순</button>
          <button
            className={`rounded-[8px] px-3 py-1 text-[13px] font-semibold transition-colors active:scale-95 ${
              !isRecentOrder ? "bg-white text-[#191f28] shadow-[0_2px_4px_rgba(0,0,0,0.06)]" : "text-[#8b95a1]"
            }`}
            onClick={() => setRecentOrder(false)}
          >공감순</button>
        </div>
      </div>

      {error && (
        <p className="px-5 py-10 text-center text-[14px] text-[#f04452]">{error}</p>
      )}

      {!error && posts.length === 0 && !loading && (
        <p className="whitespace-pre-line px-5 py-16 text-center text-[14px] leading-[1.5] text-[#8b95a1]">
          {keyword ? "검색 결과가 없어요." : "아직 게시글이 없어요.\n첫 글을 남겨보세요."}
        </p>
      )}

      {/* 게시글 리스트 */}
      <ul className="divide-y divide-[#f2f4f6]">
        {posts.map((post) => (
          <li
            key={post.postId}
            className="cursor-pointer px-5 py-4 transition-colors active:bg-[#f9fafb]"
            onClick={() => router.push(`/community/${post.postId}`)}
          >
            <div className="flex items-center gap-1.5">
              {post.hasImage && (
                <svg className="shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b95a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              )}
              <h3 className="truncate text-[16px] font-semibold leading-[1.4] text-[#191f28]">{post.title}</h3>
            </div>

            {post.categories.length > 0 && (
              <p className="mt-1 truncate text-[13px] font-medium text-[#3182f6]">
                {post.categories.map((name) => `#${name}`).join(" ")}
              </p>
            )}

            <p className="mt-1.5 text-[13px] text-[#8b95a1]">
              {post.writerName} · {formatDateTime(post.createdAt)}
            </p>

            <div className="mt-2 flex items-center gap-3 text-[12px] font-medium text-[#8b95a1]">
              <span className="inline-flex items-center gap-1">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {post.commentCount}
              </span>
              <span className="inline-flex items-center gap-1">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {post.likeCount}
              </span>
              <span>조회 {post.viewCount}</span>
            </div>
          </li>
        ))}
      </ul>

      {loading && (
        <p className="py-6 text-center text-[13px] text-[#8b95a1]">불러오는 중...</p>
      )}

      {!loading && page < totalPages - 1 && (
        <button
          className="mx-5 mt-3 rounded-[14px] bg-[#f2f4f6] py-3.5 text-[14px] font-semibold text-[#4e5968] active:scale-[0.99]"
          onClick={() => fetchPage(page + 1, true)}
        >
          더보기
        </button>
      )}

      {/* 글쓰기 FAB */}
      <button
        className="fixed bottom-6 right-6 cursor-pointer drop-shadow-[0_4px_12px_rgba(49,130,246,0.4)] transition-transform active:scale-95"
        onClick={() => router.push("/write")}
      >
        <Icon
          className="rounded-full"
          path={"/resources/write_button.png"}
          scale={0.5}
          size={110}
          cols={1}
          rows={1}
          gap={0}
          index={0} />
      </button>
    </div>
  );
}
