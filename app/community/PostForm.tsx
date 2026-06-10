'use client'
import { getCachedAllConditions } from "#/lib/cache";
import { parseError } from "#/lib/parseError";
import { createPost, getPost, updatePost } from "#/service/community";
import { type Condition } from "#/service/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type Props = { postId?: number };

export default function PostForm({ postId }: Props) {
  const router = useRouter();
  const isEdit = postId != null;

  const [conditions, setConditions] = useState<Condition[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);

  const [ready, setReady] = useState(!isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await getCachedAllConditions();
        if (cancelled) return;
        setConditions(all);

        if (isEdit && postId != null) {
          const detail = await getPost(postId);
          if (cancelled) return;
          setTitle(detail.title);
          setContent(detail.content);
          setExistingImageUrls(detail.imageUrls);
          // 카테고리 이름 → conditionId 역매핑
          const byName = new Map(all.map((c) => [c.conditionName, c.conditionId]));
          const ids = detail.categories
            .map((name) => byName.get(name))
            .filter((id): id is number => id != null);
          setSelected(new Set(ids));
          setReady(true);
        }
      } catch (err) {
        toast.error(parseError(err));
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const sliceMiddle = (text: string) => {
    if (text.length < 5) return <>{text}</>;
    const middle = Math.floor(text.length / 2);
    return (
      <>
        {text.slice(0, middle)}
        <br />
        {text.slice(middle)}
      </>
    );
  };

  const toggleCondition = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 주의: FileList는 라이브 참조 → 호출 즉시 File[]로 복사해 넘긴다.
  // (input.value='' 로 비우면 FileList도 비므로, setImages 콜백 내부에서 읽으면 빈 배열이 됨)
  const onPickImages = (files: File[]) => {
    if (files.length === 0) return;
    setImages((prev) => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (title.trim() === "") {
      toast.error("제목을 입력해주세요.");
      return;
    }
    if (content.trim() === "") {
      toast.error("내용을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const conditionIds = [...selected];
      if (isEdit && postId != null) {
        await updatePost(postId, { title, content, conditionIds, newImages: images });
        toast.success("수정했어요.");
        router.push(`/community/${postId}`);
      } else {
        const newId = await createPost({ title, content, conditionIds, images });
        toast.success("등록했어요.");
        router.push(`/community/${newId}`);
      }
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) {
    return <p className="bg-[#f2f4f6] px-5 py-20 text-center text-[14px] text-[#8b95a1]">불러오는 중...</p>;
  }

  return (
    <div className="flex flex-1 flex-col bg-[#f2f4f6] px-5 pb-8">
      <h1 className="pt-2 pb-4 text-[22px] font-bold tracking-[-0.02em] text-[#191f28]">
        {isEdit ? "글 수정" : "글쓰기"}
      </h1>

      <section className="flex flex-1 flex-col gap-3">
        <div className="rounded-[20px] bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-[16px] font-bold text-[#191f28]">분류</h2>
            <span className="text-[12px] text-[#8b95a1]">선택 안 하면 자유게시판 글</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {conditions.map((c) => (
              <button
                type="button"
                key={c.conditionId}
                className={`rounded-[10px] py-1.5 leading-tight font-semibold transition-transform active:scale-[0.97] ${
                  c.conditionName.length === 4 ? "text-[0.7rem]" : "text-[0.78rem]"
                } ${selected.has(c.conditionId) ? "bg-[#3182f6] text-white" : "bg-[#f2f4f6] text-[#4e5968]"}`}
                onClick={() => toggleCondition(c.conditionId)}
              >
                {sliceMiddle(c.conditionName)}
              </button>
            ))}
          </div>
        </div>

        <form className="flex flex-1 flex-col gap-3" onSubmit={onSubmit}>
          <div className="rounded-[20px] bg-white p-4">
            <input
              className="w-full text-[20px] font-bold text-[#191f28] placeholder:text-[#b0b8c1] focus:outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목"
            />
            <div className="my-3 h-px w-full bg-[#e5e8eb]" />
            <textarea
              className="min-h-60 w-full resize-none text-[16px] leading-[1.5] text-[#191f28] placeholder:text-[#b0b8c1] focus:outline-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요."
            />
          </div>

          {isEdit && existingImageUrls.length > 0 && (
            <div className="rounded-[16px] bg-white p-3">
              <p className="mb-2 text-[13px] font-semibold text-[#4e5968]">기존 사진</p>
              <div className="flex gap-2 overflow-x-auto">
                {existingImageUrls.map((url) => (
                  <img key={url} src={url} alt="기존 이미지" className="h-20 w-20 shrink-0 rounded-[10px] object-cover" />
                ))}
              </div>
              <p className="mt-2 text-[11px] text-[#8b95a1]">기존 사진은 유지되며, 아래에서 사진을 추가할 수 있어요.</p>
            </div>
          )}

          {images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto rounded-[16px] bg-white p-3">
              {images.map((file, i) => (
                <div key={i} className="relative shrink-0">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    className="h-20 w-20 rounded-[10px] object-cover"
                  />
                  <button
                    type="button"
                    className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#191f28] text-[12px] leading-none text-white"
                    onClick={() => removeImage(i)}
                  >×</button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-2 rounded-[16px] bg-white p-3">
            <label htmlFor="fileInput" className="flex grow cursor-pointer items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#f2f4f6]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b95a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </span>
              <span className="truncate text-[14px] font-medium text-[#4e5968]">
                {images.length > 0 ? `사진 ${images.length}장 추가됨` : "사진 첨부"}
              </span>
            </label>
            <input
              className="hidden"
              id="fileInput"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const picked = Array.from(e.target.files ?? []);
                e.target.value = "";
                onPickImages(picked);
              }}
            />
            <button
              type="submit"
              disabled={submitting}
              className="shrink-0 cursor-pointer rounded-[12px] bg-[#3182f6] px-5 py-2.5 text-[15px] font-semibold text-white transition-transform active:scale-[0.97] active:bg-[#2272eb] disabled:opacity-60"
            >
              {isEdit ? "수정" : "등록"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
