import { api } from "#/lib/api";
import {
  type CommentResponse,
  type Page,
  type PostDetail,
  type PostListItem,
} from "./types";

export type PostSort = "createdAt,desc" | "likeCount,desc";

export type GetPostsParams = {
  isFree?: boolean;
  conditionIds?: number[];
  page?: number;
  size?: number;
  sort?: PostSort;
};

// 게시글 목록 (태그필터/자유글토글/정렬)
export const getPosts = async ({
  isFree = false,
  conditionIds = [],
  page = 0,
  size = 10,
  sort = "createdAt,desc",
}: GetPostsParams): Promise<Page<PostListItem>> => {
  const params: Record<string, string | number | boolean> = { isFree, page, size, sort };
  if (conditionIds.length > 0) params.conditionIds = conditionIds.join(",");
  const res = await api.get("/posts", { params });
  return res.data;
};

// 게시글 검색 (제목/본문/작성자명)
export const searchPosts = async (
  keyword: string,
  page = 0,
  size = 10
): Promise<Page<PostListItem>> => {
  const res = await api.get("/posts/search", { params: { keyword, page, size } });
  return res.data;
};

// 게시글 상세 (조회수 +1 자동)
export const getPost = async (postId: number): Promise<PostDetail> => {
  const res = await api.get(`/posts/${postId}`);
  return res.data;
};

// 게시글 작성 — multipart/form-data. Content-Type 수동지정 금지(브라우저가 boundary 설정)
export const createPost = async (data: {
  title: string;
  content: string;
  conditionIds?: number[];
  images?: File[];
}): Promise<number> => {
  const form = new FormData();
  form.append("title", data.title);
  form.append("content", data.content);
  (data.conditionIds ?? []).forEach((id) => form.append("conditionIds", String(id)));
  (data.images ?? []).forEach((file) => form.append("images", file));
  const res = await api.post("/posts", form);
  return res.data;
};

// 게시글 수정 — multipart/form-data, PUT. 본인만. conditionIds 덮어쓰기.
export const updatePost = async (
  postId: number,
  data: {
    title: string;
    content: string;
    conditionIds?: number[];
    newImages?: File[];
    deleteImageIds?: number[];
  }
): Promise<void> => {
  const form = new FormData();
  form.append("title", data.title);
  form.append("content", data.content);
  (data.conditionIds ?? []).forEach((id) => form.append("conditionIds", String(id)));
  (data.newImages ?? []).forEach((file) => form.append("newImages", file));
  (data.deleteImageIds ?? []).forEach((id) => form.append("deleteImageIds", String(id)));
  await api.put(`/posts/${postId}`, form);
};

// 공감 토글 — 응답 isLiked가 최종 상태
export const toggleLike = async (postId: number): Promise<boolean> => {
  const res = await api.post(`/posts/${postId}/likes`);
  return res.data.isLiked;
};

// 댓글 작성
export const addComment = async (postId: number, content: string): Promise<number> => {
  const res = await api.post(`/posts/${postId}/comments`, { content });
  return res.data;
};

// 댓글 수정 (본인만)
export const updateComment = async (postId: number, commentId: number, content: string) => {
  return api.put(`/posts/${postId}/comments/${commentId}`, { content });
};

// 댓글 삭제 (본인만)
export const deleteComment = async (postId: number, commentId: number) => {
  return api.delete(`/posts/${postId}/comments/${commentId}`);
};

// 마이페이지 ----------------------------------------------------------------

export const getMyPosts = async (page = 0, size = 10): Promise<Page<PostListItem>> => {
  const res = await api.get("/members/me/posts", { params: { page, size } });
  return res.data;
};

export const getMyLikedPosts = async (page = 0, size = 10): Promise<Page<PostListItem>> => {
  const res = await api.get("/members/me/likes", { params: { page, size } });
  return res.data;
};

export const getMyComments = async (page = 0, size = 10): Promise<Page<CommentResponse>> => {
  const res = await api.get("/members/me/comments", { params: { page, size } });
  return res.data;
};
