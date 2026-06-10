'use client'

import PostForm from "@/community/PostForm";
import { useParams } from "next/navigation";

export default function EditPostPage() {
  const params = useParams();
  return <PostForm postId={Number(params.postId)} />;
}
